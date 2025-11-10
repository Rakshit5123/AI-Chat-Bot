import { storage } from "./storage";

async function seed() {
  try {
    const username = process.env.SEED_USERNAME || "demo";
    let user = await storage.getUserByUsername?.(username);
    if (!user) {
      user = await storage.createUser({ username, password: "" });
      console.log("Created demo user", user.id);
    }

    // create a demo session
    const sessions = await storage.getAllSessions();
    if (!sessions || sessions.length === 0) {
      const session = await storage.createSession({ title: "Welcome Session", provider: "openai", model: "gpt-5" } as any);
      console.log("Created demo session", session.id);
    }

    console.log("Seeding complete");
  } catch (e) {
    console.error("Seed failed", e);
  } finally {
    process.exit(0);
  }
}

seed();
