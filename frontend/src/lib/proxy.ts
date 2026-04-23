/**
 * proxy.ts
 * A thin utility to forward Next.js API route requests to the Express backend.
 * The frontend UI calls /api/*, which hits these Next.js routes.
 * These routes then forward everything to http://localhost:5000/api/*.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Forward any Next.js route request to the backend Express server.
 * Preserves method, headers (including auth cookie), body, and query params.
 */
export async function forwardToBackend(
  request: NextRequest,
  backendPath: string
): Promise<NextResponse> {
  try {
    const url = new URL(backendPath, BACKEND_URL);

    // Preserve query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Forward all headers except ones Next.js adds that would confuse Express
    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
      const skip = ['host', 'connection', 'transfer-encoding'];
      if (!skip.includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    // Read body for non-GET/HEAD requests
    let body: BodyInit | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        // Forward FormData (file uploads) as-is
        body = await request.formData();
        // Let fetch set the correct multipart content-type with boundary
        forwardHeaders.delete('content-type');
      } else {
        body = await request.text();
      }
    }

    const backendResponse = await fetch(url.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body,
      credentials: 'include',
    });

    // Forward the response back, preserving status and headers
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      // Forward set-cookie so auth cookies work
      responseHeaders.set(key, value);
    });

    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Proxy] Failed to reach backend at ${BACKEND_URL}:`, error.message);
    return NextResponse.json(
      { error: 'Backend server is not reachable. Make sure the backend is running on port 5000.' },
      { status: 503 }
    );
  }
}
