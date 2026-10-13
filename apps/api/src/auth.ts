import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { HttpError } from './errors.js';

export type AdminSession = { id: string; email: string; name: string };

const attempts = new Map<string, { count: number; resetAt: number }>();

export function assertLoginAllowed(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) return;
  if (entry.count >= 8) {
    throw new HttpError(429, 'Demasiados intentos. Esperá unos minutos.');
  }
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(ip: string): void {
  attempts.delete(ip);
}

export function signAdmin(admin: AdminSession): string {
  return jwt.sign({ email: admin.email, name: admin.name }, env.jwtSecret, {
    subject: admin.id,
    expiresIn: '14d',
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Tenés que iniciar sesión' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (typeof payload === 'string' || !payload.sub || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      res.status(401).json({ error: 'La sesión venció' });
      return;
    }
    res.locals.admin = { id: payload.sub, email: payload.email, name: payload.name } satisfies AdminSession;
    next();
  } catch {
    res.status(401).json({ error: 'La sesión venció' });
  }
}
