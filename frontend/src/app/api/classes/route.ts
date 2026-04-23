import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  return forwardToBackend(request, '/api/classes');
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request, '/api/classes');
}
