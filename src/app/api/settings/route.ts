import { NextRequest, NextResponse } from "next/server";
import { loadSettings, saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadSettings());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const current = loadSettings();
  if (Array.isArray(body.favouriteStores)) {
    current.favouriteStores = body.favouriteStores;
  }
  saveSettings(current);
  return NextResponse.json(current);
}
