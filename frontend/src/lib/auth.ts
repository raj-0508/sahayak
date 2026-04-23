// User type for frontend use
export type User = {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'teacher' | 'student';
  avatar?: string;
  phone?: string;
  subject_ids?: string[];
  grade_level?: number;
  teaching_grades?: number[];
  preferred_language?: string;
  created_at?: string;
};

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}

// ── Point all API calls to the Express backend ──────────────
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sahayak-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function signupUser(
  name: string,
  email: string,
  password: string,
  user_type: 'student' | 'teacher',
  phone?: string,
  subject_ids?: string[],
  grade_level?: number,
  teaching_grades?: number[]
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password, user_type, phone, subject_ids, grade_level, teaching_grades }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function logoutUser(): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sahayak-token') : null;
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}
