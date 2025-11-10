import { 
  type User, type InsertUser,
  type Session, type InsertSession,
  type Message, type InsertMessage
} from "@shared/schema";
import { randomUUID } from "crypto";
import { MongoStorage } from "./mongoStorage";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessagesBySession(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const session: Session = {
      ...insertSession,
      id,
      createdAt: now,
      lastMessageAt: now,
      provider: insertSession.provider ?? "",
      model: insertSession.model ?? "",
      systemPrompt: insertSession.systemPrompt ?? null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      Array.from(this.messages.values())
        .filter(msg => msg.sessionId === id)
        .forEach(msg => this.messages.delete(msg.id));
    }
    return deleted;
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      tokenCount: insertMessage.tokenCount ?? null,
    };
    this.messages.set(id, message);

    await this.updateSession(insertMessage.sessionId, {
      lastMessageAt: message.createdAt,
    });

    return message;
  }

  async deleteMessagesBySession(sessionId: string): Promise<boolean> {
    const messages = await this.getMessagesBySession(sessionId);
    messages.forEach(msg => this.messages.delete(msg.id));
    return true;
  }
}

// choose storage backend based on environment
let storageImpl: IStorage;
if (process.env.MONGODB_URI) {
  try {
    storageImpl = new MongoStorage();
    console.log("Using MongoStorage (MONGODB_URI configured)");
  } catch (e) {
    console.error("Failed to initialize MongoStorage, falling back to MemStorage", e);
    storageImpl = new MemStorage();
  }
} else {
  storageImpl = new MemStorage();
}

export const storage = storageImpl;
