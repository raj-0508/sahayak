"use client";

import { AuthContext } from '@/hooks/use-auth';
import { loginUser, signupUser, logoutUser, getCurrentUser, type User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check for existing session on mount
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to get current user", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    
    initAuth();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      setUser(response.user);
      
      // Store token in localStorage for client-side access
      localStorage.setItem('sahayak-token', response.token);
      localStorage.setItem('sahayak-user', JSON.stringify(response.user));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.name}!`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [router, toast]);

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    user_type: 'student' | 'teacher',
    phone?: string,
    subject_ids?: string[],
    grade_level?: number,
    teaching_grades?: number[]
  ) => {
    try {
      const response = await signupUser(name, email, password, user_type, phone, subject_ids, grade_level, teaching_grades);
      setUser(response.user);
      
      // Store token in localStorage for client-side access
      localStorage.setItem('sahayak-token', response.token);
      localStorage.setItem('sahayak-user', JSON.stringify(response.user));
      
      toast({
        title: "Account Created",
        description: `Welcome to Sahayak, ${response.user.name}!`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('sahayak-token');
      localStorage.removeItem('sahayak-user');
      router.push('/');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
          <p className="text-muted-foreground">Loading Sahayak...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
