import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { ShoppingListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareEntry {
  items: ShoppingListItem[];
  created_at: number;
  expires_at: number;
}

// In-memory store (module-level singleton for Next.js server)
const shareStore = new Map<string, ShareEntry>();

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function cleanupExpired(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  shareStore.forEach((entry, key) => {
    if (entry.expires_at < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => shareStore.delete(key));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: ShoppingListItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required and must not be empty" }, { status: 400 });
    }

    cleanupExpired();

    const id = generateId();
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    shareStore.set(id, {
      items,
      created_at: now,
      expires_at: now + SIX_HOURS,
    });

    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/share/${id}`;

    // Generate QR code as base64 data URL
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#2D3A31",
        light: "#F9F8F4",
      },
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

  cleanupExpired();

  const entry = shareStore.get(id);
  if (!entry) {
    return NextResponse.json({ error: "Shared list not found or has expired" }, { status: 404 });
  }

  return NextResponse.json({
    items: entry.items,
    created_at: new Date(entry.created_at).toISOString(),
    expires_at: new Date(entry.expires_at).toISOString(),
  });
}
