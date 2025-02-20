import { Request, RequestHandler, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    }
  }
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export type AuthRequest = Request;
export type AuthRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => void | Response | Promise<void | Response>;

export const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
]; 