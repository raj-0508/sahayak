import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardToBackend(request, `/api/join-requests/${id}`);
}
