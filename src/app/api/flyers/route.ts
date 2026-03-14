import { NextRequest, NextResponse } from "next/server";
import { searchItems, getFlyers, getFlyerItems } from "@/lib/flipp";
import { FlyerItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function applyFiltersAndSort(
  items: FlyerItem[],
  storeFilter: string,
  minPrice: string | null,
  maxPrice: string | null,
  sortBy: string
): FlyerItem[] {
  let result = items;

  if (storeFilter) {
    result = result.filter(
      (item) => item.store_name.toLowerCase() === storeFilter.toLowerCase()
    );
  }

  const min = minPrice ? Number.parseFloat(minPrice) : Number.NaN;
  const max = maxPrice ? Number.parseFloat(maxPrice) : Number.NaN;
  if (!Number.isNaN(min)) result = result.filter((i) => i.price != null && i.price >= min);
  if (!Number.isNaN(max)) result = result.filter((i) => i.price != null && i.price <= max);

  if (sortBy === "price_asc") {
    result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  } else if (sortBy === "price_desc") {
    result.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  } else if (sortBy === "savings") {
    result.sort((a, b) => (b.savings_percentage ?? 0) - (a.savings_percentage ?? 0));
  }

  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode") || "M2N7C1";
  const search = searchParams.get("search") || "";
  const flyerIdParam = searchParams.get("flyer_id");
  const storeFilter = searchParams.get("store") || "";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const sortBy = searchParams.get("sort_by") || "";

  try {
    // Flyer items mode: fetch all items from a specific flyer by its ID
    if (flyerIdParam) {
      const flyerId = Number.parseInt(flyerIdParam, 10);
      const merchantName = searchParams.get("merchant_name") || "Unknown Store";
      if (!Number.isNaN(flyerId)) {
        const items = await getFlyerItems(flyerId, postalCode, merchantName);
        return NextResponse.json({ mode: "flyer", items: applyFiltersAndSort(items, storeFilter, minPrice, maxPrice, sortBy) });
      }
    }

    if (!search.trim()) {
      // Browse mode: return list of flyers/stores
      const flyers = await getFlyers(postalCode);
      return NextResponse.json({ mode: "browse", flyers });
    }

    // Search mode: return filtered/sorted items
    const raw = await searchItems(postalCode, search);
    const items = applyFiltersAndSort(raw, storeFilter, minPrice, maxPrice, sortBy);
    return NextResponse.json({ mode: "search", items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Flipp API error:", msg);
    let errorMode = "browse";
    if (flyerIdParam) errorMode = "flyer";
    else if (search) errorMode = "search";
    return NextResponse.json(
      {
        mode: errorMode,
        items: [],
        flyers: [],
        error: `Unable to fetch deals: ${msg}`,
      },
      { status: 200 }
    );
  }
}
