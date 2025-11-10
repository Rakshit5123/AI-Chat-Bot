import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_TTL = process.env.JWT_TTL || "7d";

export function signToken(payload: object) {
  const options: SignOptions = { expiresIn: JWT_TTL as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET as Secret, options);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || req.cookies?.token;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // attach user to request for downstream handlers
    (req as any).userId = decoded.sub || decoded.id || decoded.userId;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function createOrGetDemoUser(username: string) {
  let user = await storage.getUserByUsername(username);
  if (!user) {
    user = await storage.createUser({ username, password: "" });
  }
  return user;
}
