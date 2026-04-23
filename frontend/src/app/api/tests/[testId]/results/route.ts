import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  return forwardToBackend(request, `/api/tests/${testId}/results`);
}
