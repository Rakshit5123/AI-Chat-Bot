import type { Session, Message, InsertSession, InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

class MemoryStorage {
  private sessions: Map<string, Session> = new Map();
  private messages: Map<string, Message> = new Map();

  // Sessions
  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async createSession(data: InsertSession): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      title: data.title,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      provider: data.provider || "cohere",
      model: data.model || "command-r-plus",
      systemPrompt: data.systemPrompt || null,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async updateSession(
    id: string,
    data: Partial<Omit<Session, "id" | "createdAt">>
  ): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) return null;

    const updated = { ...session, ...data };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    // Delete associated messages
    const messagesToDelete = Array.from(this.messages.values())
      .filter((msg) => msg.sessionId === id)
      .map((msg) => msg.id);
    
    messagesToDelete.forEach((msgId) => this.messages.delete(msgId));
    
    return this.sessions.delete(id);
  }

  // Messages
  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      createdAt: new Date(),
      tokenCount: data.tokenCount || null,
    };
    this.messages.set(message.id, message);

    // Update session's lastMessageAt
    const session = this.sessions.get(data.sessionId);
    if (session) {
      session.lastMessageAt = new Date();
      this.sessions.set(session.id, session);
    }

    return message;
  }

  async deleteMessagesBySession(sessionId: string): Promise<void> {
    const messagesToDelete = Array.from(this.messages.values())
      .filter((msg) => msg.sessionId === sessionId)
      .map((msg) => msg.id);
    
    messagesToDelete.forEach((msgId) => this.messages.delete(msgId));
  }
}

export const memoryStorage = new MemoryStorage();
