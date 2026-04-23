/**
 * Centralized API helper for all frontend -> backend calls.
 * Reads NEXT_PUBLIC_API_URL (defaults to http://localhost:5000).
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sahayak-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST', credentials: 'include', headers: getAuthHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT', credentials: 'include', headers: getAuthHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE', credentials: 'include', headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/** For multipart/form-data uploads (PDFs, files) */
export async function apiPostForm<T = any>(path: string, formData: FormData): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sahayak-token') : null;
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST', credentials: 'include', headers, body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
