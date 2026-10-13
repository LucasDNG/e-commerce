import type { NextFunction, Request, Response } from 'express';
import type { ZodError } from 'zod';

export function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos';
}
