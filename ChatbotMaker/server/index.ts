import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from "mongoose";
import 'dotenv/config'; // loads .env automatically

// ---------------------------------------------------
// 🚀 Startup Logs
// ---------------------------------------------------
console.log("🚀 Starting development server...");
console.log("▶️ server/index.ts loaded");
console.log("🔍 Environment variables check:");
console.log("MONGODB_URI =", process.env.MONGODB_URI);
console.log("PORT =", process.env.PORT);
console.log("COHERE_API_KEY =", process.env.COHERE_API_KEY ? "***" + process.env.COHERE_API_KEY.slice(-4) : "NOT SET");

// ---------------------------------------------------
// Handle unexpected crashes gracefully
// ---------------------------------------------------
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// ---------------------------------------------------
// Express app setup
// ---------------------------------------------------
const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser() as unknown as express.RequestHandler);

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      log(logLine);
    }
  });

  next();
});

// ---------------------------------------------------
// Main Async Block
// ---------------------------------------------------
(async () => {
  let useMemoryStorage = false;

  try {
    // ✅ Use MONGODB_URI (the correct one from .env)
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("❌ MONGODB_URI missing in .env file");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error(
      "⚠️ MongoDB connection failed:",
      err instanceof Error ? err.message : err
    );
    console.log("⚡ Using in-memory storage instead (data will not persist)");
    useMemoryStorage = true;
  }

  // 2️⃣ Register routes
  const server = await registerRoutes(app);

  // 3️⃣ Error middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("❌ Middleware error:", err);
  });

  // 4️⃣ Setup Vite / static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 5️⃣ Start the server
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    if (useMemoryStorage) {
      console.log("💾 Using in-memory storage (data will be lost on restart)");
    }
  });
})();
