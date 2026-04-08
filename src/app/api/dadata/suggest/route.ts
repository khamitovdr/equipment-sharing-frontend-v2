import { type NextRequest, NextResponse } from "next/server";

const DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
const DADATA_API_KEY = process.env.DADATA_API_KEY ?? "";

export async function POST(request: NextRequest) {
  if (!DADATA_API_KEY) {
    return NextResponse.json({ detail: "Dadata API key not configured" }, { status: 500 });
  }
  const body = await request.json();
  const query = body.query;
  if (!query || typeof query !== "string") {
    return NextResponse.json({ detail: "query is required" }, { status: 400 });
  }
  const res = await fetch(DADATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify({ query, count: 5 }),
  });
  if (!res.ok) {
    return NextResponse.json({ detail: "Dadata request failed" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
