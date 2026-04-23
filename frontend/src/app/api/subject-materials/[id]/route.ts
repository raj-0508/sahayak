import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardToBackend(request, `/api/subject-materials/${id}`);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardToBackend(request, `/api/subject-materials/${id}`);
}
