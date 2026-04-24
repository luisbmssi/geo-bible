import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";

const requests = new Map<string, { count: number; time: number }>();

const LIMIT = 10;
const WINDOW = 60 * 1000;

export async function GET(req: Request) {
  const rawIp = req.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  const now = Date.now();
  const user = requests.get(ip);

  if (user) {
    if (now - user.time < WINDOW) {
      if (user.count >= LIMIT) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        );
      }
      user.count++;
    } else {
      requests.set(ip, { count: 1, time: now });
    }
  } else {
    requests.set(ip, { count: 1, time: now });
  }

  const data = await getSheetData();

  return NextResponse.json({ data });
}
