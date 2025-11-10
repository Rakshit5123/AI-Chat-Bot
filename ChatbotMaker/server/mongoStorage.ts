import { MongoClient, ObjectId, Document } from "mongodb";
import { IStorage } from "./storage";
import type { InsertUser, User, InsertSession, Session, InsertMessage, Message } from "@shared/schema";
import { randomUUID } from "crypto";

let client: MongoClient | null = null;

async function getClient() {
  if (client) return client;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not configured");
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export class MongoStorage implements IStorage {
  private dbName = process.env.MONGODB_DB || "chatbot";

  private async col<T extends Document = any>(name: string) {
    const c = await getClient();
    return c.db(this.dbName).collection<T>(name);
  }

  async getUser(id: string) {
    const col = await this.col<User>("users");
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  }

  async getUserByUsername(username: string) {
    const col = await this.col<User>("users");
    const doc = await col.findOne({ username });
    return doc ?? undefined;
  }

  async createUser(insertUser: InsertUser) {
    const col = await this.col<User>("users");
    const id = randomUUID();
    const doc = { ...insertUser, id };
    await col.insertOne(doc);
    return doc as User;
  }

  async getAllSessions() {
    const col = await this.col<Session>("sessions");
    const rows = await col.find().sort({ lastMessageAt: -1 }).toArray();
    return rows as Session[];
  }

  async getSession(id: string) {
    const col = await this.col<Session>("sessions");
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  }

  async createSession(insertSession: InsertSession) {
    const col = await this.col<Session>("sessions");
    const id = randomUUID();
    const now = new Date();
    const doc: Session = { ...insertSession, id, createdAt: now, lastMessageAt: now } as any;
    await col.insertOne(doc);
    return doc;
  }

  async updateSession(id: string, updates: Partial<Session>) {
    const col = await this.col<Session>("sessions");
    const result = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" as const }
    );
    if (!result) return undefined;
    return result as unknown as Session;
  }

  async deleteSession(id: string) {
    const col = await this.col<Session>("sessions");
    const r = await col.deleteOne({ id });
    const messages = await this.col<Message>("messages");
    await messages.deleteMany({ sessionId: id });
    return r.deletedCount === 1;
  }

  async getMessagesBySession(sessionId: string) {
    const col = await this.col<Message>("messages");
    const rows = await col.find({ sessionId }).sort({ createdAt: 1 }).toArray();
    return rows as Message[];
  }

  async createMessage(insertMessage: InsertMessage) {
    const col = await this.col<Message>("messages");
    const id = randomUUID();
    const doc: Message = { ...insertMessage, id, createdAt: new Date() } as any;
    await col.insertOne(doc);
    await this.updateSession(insertMessage.sessionId, { lastMessageAt: doc.createdAt });
    return doc;
  }

  async deleteMessagesBySession(sessionId: string) {
    const col = await this.col<Message>("messages");
    await col.deleteMany({ sessionId });
    return true;
  }
}
