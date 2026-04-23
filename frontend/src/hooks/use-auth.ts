"use client";

import type { User } from '@/lib/auth';
import React, { createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string, 
    email: string, 
    password: string, 
    user_type: 'student' | 'teacher', 
    phone?: string, 
    subject_ids?: string[],
    grade_level?: number,
    teaching_grades?: number[]
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
