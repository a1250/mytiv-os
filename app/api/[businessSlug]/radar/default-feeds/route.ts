import { NextResponse } from "next/server";
import { DEFAULT_FEEDS } from "@/lib/services/rss";

export async function GET() {
  return NextResponse.json(DEFAULT_FEEDS);
}
