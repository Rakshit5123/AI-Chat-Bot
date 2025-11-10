import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { validateMessageContent } from "./safety";
import { getProvider } from "./providers";
import rateLimit from "express-rate-limit";
import { requireAuth, signToken, createOrGetDemoUser } from "./auth";

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // simple per-user in-memory quota tracker (tokens or requests)
  const userQuota: Map<string, { count: number; resetAt: number }> = new Map();
  const QUOTA_WINDOW_MS = 60 * 1000; // 1 minute window for quick demo
  const QUOTA_LIMIT = Number(process.env.QUOTA_PER_MINUTE || 60);

  function checkUserQuotaMiddleware(req: Request, res: Response, next: Function) {
    const userId = (req as any).userId || req.headers["x-user-id"] as string || "demo-user";

    const now = Date.now();
    const entry = userQuota.get(userId);
    if (!entry || entry.resetAt < now) {
      userQuota.set(userId, { count: 1, resetAt: now + QUOTA_WINDOW_MS });
      return next();
    }

    if (entry.count >= QUOTA_LIMIT) {
      return res.status(429).json({ error: "Quota exceeded" });
    }

    entry.count += 1;
    userQuota.set(userId, entry);
    next();
  }

  // Auth endpoints
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "username required" });

      const user = await createOrGetDemoUser(username);
      const token = signToken({ sub: user.id, username: user.username });
      res.json({ token, user });
    } catch (error: any) {
      console.error("Auth error", error);
      res.status(500).json({ error: "Auth failed" });
    }
  });

  app.get("/api/sessions", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      console.error("Error creating session:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }

      const updated = await storage.updateSession(req.params.id, { title: title.trim() });
      if (!updated) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.get("/api/messages", async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const messages = await storage.getMessagesBySession(sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.delete("/api/sessions/:id/messages", async (req: Request, res: Response) => {
    try {
      await storage.deleteMessagesBySession(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  app.post("/api/chat", chatLimiter, async (req: Request, res: Response) => {
    try {
  const { sessionId, content, model = "command-r-plus-08-2024", provider = "cohere", systemPrompt } = req.body;

      // run safety checks on user content
      const safety = await validateMessageContent(content);
      if (!safety.ok) {
        const errorMessage = safety.reason || "Message blocked by safety policy";
        // persist block event as assistant message for visibility
        await storage.createMessage({ sessionId, role: "assistant", content: `Message blocked: ${errorMessage}` });
        return res.status(400).json({ error: errorMessage });
      }
  const userId = (req as any).userId;

      if (!sessionId || !content) {
        return res.status(400).json({ error: "Session ID and content are required" });
      }

      const session = await storage.getSession(sessionId);
      // basic ownership check if sessions are per-user in a real app
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const validatedMessage = insertMessageSchema.parse({
        sessionId,
        role: "user",
        content: content.trim(),
      });

      const userMessage = await storage.createMessage(validatedMessage);

      const messageHistory = await storage.getMessagesBySession(sessionId);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let assistantContent = "";

  const chatProvider = getProvider(provider);

      const abortController = new AbortController();
      req.on("close", () => {
        abortController.abort();
      });

      try {
        await chatProvider.streamCompletion(
          messageHistory,
          {
            model,
            systemPrompt,
            maxTokens: 8192,
          },
          (chunk) => {
            if (chunk.done) {
              res.write(`data: [DONE]\n\n`);
            } else {
              assistantContent += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
            }
          },
          abortController.signal
        );

        if (assistantContent) {
          await storage.createMessage({
            sessionId,
            role: "assistant",
            content: assistantContent,
          });

          if (session.title === "New Conversation" || messageHistory.length <= 1) {
            await storage.updateSession(sessionId, {
              title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
            });
          }
        }

        res.end();
      } catch (error: any) {
        if (error.message === "Stream aborted") {
          console.log("Chat stream aborted by client");
          res.end();
        } else {
          console.error("Error in chat stream:", error);
          let errorMessage = "An error occurred while generating response";
          
          if (error.status === 429 || error.code === "insufficient_quota") {
            errorMessage = "Cohere API quota exceeded. Please check your API key billing details.";
          } else if (error.status === 401) {
            errorMessage = "Invalid Cohere API key. Please check your credentials in settings.";
          } else if (error.message) {
            errorMessage = error.message;
          }

          await storage.createMessage({
            sessionId,
            role: "assistant",
            content: `Error: ${errorMessage}`,
          });

          res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
      }
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      if (!res.headersSent) {
        if (error.name === "ZodError") {
          return res.status(400).json({ error: "Invalid message data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
