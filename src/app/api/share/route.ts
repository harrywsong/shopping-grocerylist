import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { ShoppingListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareEntry {
  items: ShoppingListItem[];
  created_at: number;
  expires_at: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SHARE_FILE = path.join(DATA_DIR, "shares.json");

function readStore(): Record<string, ShareEntry> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SHARE_FILE)) return {};
    return JSON.parse(fs.readFileSync(SHARE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ShareEntry>): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SHARE_FILE, JSON.stringify(store), "utf-8");
}

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function cleanupExpired(store: Record<string, ShareEntry>): Record<string, ShareEntry> {
  const now = Date.now();
  const cleaned: Record<string, ShareEntry> = {};
  for (const [key, entry] of Object.entries(store)) {
    if (entry.expires_at >= now) cleaned[key] = entry;
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: ShoppingListItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required and must not be empty" }, { status: 400 });
    }

    const store = cleanupExpired(readStore());
    const id = generateId();
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    store[id] = { items, created_at: now, expires_at: now + SIX_HOURS };
    writeStore(store);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/share/${id}`;

    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#2D3A31", light: "#F9F8F4" },
    });

    return NextResponse.json({ id, url: shareUrl, qr: qrDataUrl }, { status: 201 });
  } catch (error) {
    console.error("Share POST error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const store = cleanupExpired(readStore());
  const entry = store[id];

  if (!entry) {
    return NextResponse.json({ error: "Shared list not found or has expired" }, { status: 404 });
  }

  return NextResponse.json({
    items: entry.items,
    created_at: new Date(entry.created_at).toISOString(),
    expires_at: new Date(entry.expires_at).toISOString(),
  });
}
