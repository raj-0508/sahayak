import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import dbConnect from './db/mongoose';
import User, { IUser } from './db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-super-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  user_type: 'student' | 'teacher' | 'admin';
}

export function generateToken(user: IUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    user_type: user.user_type,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return request.cookies.get('auth-token')?.value || null;
}

export async function getAuthUser(request?: NextRequest): Promise<IUser | null> {
  try {
    let token: string | undefined;
    
    if (request) {
      // Get token from Authorization header or cookie
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = request.cookies.get('auth-token')?.value;
      }
    } else {
      // Server component - get from cookies
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) return null;
    
    const payload = verifyToken(token);
    if (!payload) return null;
    
    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    
    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
