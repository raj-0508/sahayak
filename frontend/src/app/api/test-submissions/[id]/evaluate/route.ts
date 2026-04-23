import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

// Backend uses PUT for evaluate, not PATCH
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardToBackend(request, `/api/test-submissions/${id}/evaluate`);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardToBackend(request, `/api/test-submissions/${id}/evaluate`);
}
