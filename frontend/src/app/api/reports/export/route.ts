import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

// The dashboard export page uses /api/reports/export
// Forward to backend /api/export with query params preserved
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'users';
  return forwardToBackend(request, `/api/export/${type}`);
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request, '/api/reports/export');
}
