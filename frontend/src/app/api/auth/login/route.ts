import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  return forwardToBackend(request, '/api/auth/login');
}
