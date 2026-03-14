import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flyerId = searchParams.get("flyer_id");
  const postalCode = searchParams.get("postalCode") || "M2N7C1";

  if (!flyerId) {
    return NextResponse.json({ error: "flyer_id is required" }, { status: 400 });
  }

  const url = `https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-ca&postal_code=${encodeURIComponent(postalCode)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; GroceryApp/1.0)",
    },
    cache: "no-store",
  });

  const data = await response.json();

  // Return the first 5 items raw so we can inspect the field names
  const items = Array.isArray(data.items) ? data.items.slice(0, 5) : data;
  return NextResponse.json({ status: response.status, sample_items: items });
}
