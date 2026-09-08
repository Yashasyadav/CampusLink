import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes timeout for LLM matching workflows

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const resolvedParams = await Promise.resolve(params);
  const pathStr = Array.isArray(resolvedParams?.path) ? resolvedParams.path.join("/") : "";
  const searchStr = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${searchStr}`;

  // Forward incoming headers
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== "host" && lowerKey !== "content-length") {
      forwardHeaders.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    signal: AbortSignal.timeout(120000), // 120s timeout
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const bodyBuffer = await request.arrayBuffer();
      if (bodyBuffer.byteLength > 0) {
        fetchOptions.body = bodyBuffer;
      }
    } catch {
      // Body may be empty
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, fetchOptions);

    // Copy backend response headers to client response
    const clientHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      // Allow all response headers except hop-by-hop
      if (key.toLowerCase() !== "transfer-encoding") {
        clientHeaders.append(key, value);
      }
    });

    const responseData = await backendResponse.arrayBuffer();
    return new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: clientHeaders,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(`[API Gateway Proxy Error] ${request.method} ${targetUrl}:`, errMessage);
    return NextResponse.json(
      {
        detail: `Backend proxy error: ${errMessage}`,
      },
      { status: 504 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    },
  });
}
