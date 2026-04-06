import { type NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.equip-me.ru";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const url = new URL(`/api/v1/${path}/`, API_BASE);

  // Forward query params (append to preserve repeated params like ?category_id=a&category_id=b)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Forward headers (except host)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== "host") headers.set(key, value);
  });

  const res = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined,
  });

  // Forward response
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (!["transfer-encoding", "content-encoding"].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}
