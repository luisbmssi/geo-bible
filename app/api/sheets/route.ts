import { NextResponse } from "next/server";
import { getSheetDataCached } from "@/lib/googleSheets";

const requests = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= LIMIT) return true;

  entry.count++;
  return false;
}

export async function GET(req: Request) {
  const rawIp = req.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(LIMIT),
        },
      }
    );
  }

  try {
    const data = await getSheetDataCached();
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar dados do Sheets:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar dados." },
      { status: 500 }
    );
  }
}