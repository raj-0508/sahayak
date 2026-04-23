import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  return forwardToBackend(request, `/api/tests/${testId}/publish-results`);
}
