import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-super-secret-key';

export function generateToken(user: any): string {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '7d' } as jwt.SignOptions
  );
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('auth-token', { path: '/' });
}
