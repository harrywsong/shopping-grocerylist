import { FlyerItem, StoreFlyer } from "./types";

const FLIPP_BASE = "https://backflipp.wishabi.com/flipp";

interface FlippSearchItem {
  id: number | string;
  name: string;
  price?: number | null;
  pre_price_text?: string | null;
  current_price?: number | null;
  sale_story?: string | null;
  image_url?: string | null;
  cutout_image_url?: string | null;
  // Actual image fields returned by the Flipp API
  clean_image_url?: string | null;
  clipping_image_url?: string | null;
  merchant_name?: string;
  valid_from?: string | null;
  valid_to?: string | null;
  unit?: string | null;
  description?: string | null;
}

interface FlippFlyerRaw {
  id: number;
  name: string;
  // The API returns the store name as "merchant" (a plain string)
  merchant?: string;
  merchant_name?: string;
  merchant_id?: number;
  valid_from?: string;
  valid_to?: string;
  thumbnail_url?: string | null;
  items_count?: number;
  logo_url?: string | null;
  merchant_logo?: string | null;
}

function parseSavingsFromSaleStory(
  saleStory: string | null | undefined,
  currentPrice: number | null | undefined
): { original_price: number | null; savings_percentage: number | null } {
  if (!saleStory || currentPrice == null) {
    return { original_price: null, savings_percentage: null };
  }

  // Try to find a higher price in the sale story (e.g. "Was $5.99", "Reg. $4.99")
  const priceRegex = /\$\s*(\d+(?:\.\d{1,2})?)/g;
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = priceRegex.exec(saleStory)) !== null) {
    const p = Number.parseFloat(m[1]);
    if (!Number.isNaN(p)) prices.push(p);
  }

  // Find a price higher than current price — that's likely the original
  const higherPrice = prices.find((p) => p > currentPrice);
  if (higherPrice) {
    const savings = Math.round(((higherPrice - currentPrice) / higherPrice) * 100);
    return { original_price: higherPrice, savings_percentage: savings };
  }

  // Check for percentage patterns like "Save 30%"
  const pctRegex = /save\s+(\d+)%/i;
  const pctMatch = pctRegex.exec(saleStory);
  if (pctMatch) {
    const pct = Number.parseInt(pctMatch[1], 10);
    if (!Number.isNaN(pct) && pct > 0 && pct < 100) {
      const original = Math.round((currentPrice / (1 - pct / 100)) * 100) / 100;
      return { original_price: original, savings_percentage: pct };
    }
  }

  return { original_price: null, savings_percentage: null };
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function normalizeSearchItem(item: FlippSearchItem): FlyerItem {
  const price = toNumber(item.current_price) ?? toNumber(item.price);

  const { original_price, savings_percentage } = parseSavingsFromSaleStory(
    item.sale_story,
    price
  );

  const on_sale = !!(
    item.sale_story &&
    item.sale_story.trim().length > 0 &&
    (original_price != null || /sale|save|was|reg\.|special/i.test(item.sale_story))
  );

  return {
    id: item.id,
    name: item.name || "Unknown Item",
    price,
    original_price,
    unit: item.unit || null,
    image_url: item.clean_image_url || item.clipping_image_url || item.image_url || null,
    cutout_image_url: item.clipping_image_url || item.cutout_image_url || null,
    store_name: item.merchant_name || "Unknown Store",
    on_sale,
    savings_percentage,
    valid_from: item.valid_from || null,
    valid_to: item.valid_to || null,
    sale_story: item.sale_story || null,
  };
}

export async function searchItems(
  postalCode: string,
  query: string
): Promise<FlyerItem[]> {
  const url = `${FLIPP_BASE}/items/search?locale=en-ca&postal_code=${encodeURIComponent(
    postalCode
  )}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; GroceryApp/1.0)",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Flipp search API returned ${response.status}`);
  }

  const data = await response.json();

  // The search response may be an array or have an `items` key
  let rawItems: FlippSearchItem[] = [];
  if (Array.isArray(data)) {
    rawItems = data;
  } else if (data && Array.isArray(data.items)) {
    rawItems = data.items;
  } else if (data && typeof data === "object") {
    // Try to find any array property
    const keys = Object.keys(data);
    for (const key of keys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        rawItems = data[key];
        break;
      }
    }
  }

  return rawItems.map(normalizeSearchItem);
}

async function fetchAndExtractItems(url: string): Promise<FlippSearchItem[]> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; GroceryApp/1.0)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Flipp API ${response.status}: ${body.slice(0, 120)}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) return data as FlippSearchItem[];
  if (data && Array.isArray(data.items)) return data.items as FlippSearchItem[];

  // Some flyer endpoints nest items under "promotions" or another key
  if (data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return data[key] as FlippSearchItem[];
      }
    }
  }
  return [];
}

interface FlippFlyerItemRaw {
  id: number | string;
  name: string;
  price?: string | number | null;
  discount?: string | null;
  cutout_image_url?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  flyer_id?: number;
}

function normalizeFlyerItem(item: FlippFlyerItemRaw, merchantName: string): FlyerItem {
  const price = toNumber(item.price);
  const { original_price, savings_percentage } = parseSavingsFromSaleStory(
    typeof item.discount === "string" ? item.discount : null,
    price
  );
  const on_sale = !!(original_price || (item.discount && String(item.discount).trim().length > 0));

  return {
    id: item.id,
    name: item.name || "Unknown Item",
    price,
    original_price,
    unit: null,
    image_url: item.cutout_image_url || null,
    cutout_image_url: item.cutout_image_url || null,
    store_name: merchantName,
    on_sale,
    savings_percentage,
    valid_from: item.valid_from || null,
    valid_to: item.valid_to || null,
    sale_story: typeof item.discount === "string" ? item.discount : null,
  };
}

export async function getFlyerItems(
  flyerId: number,
  postalCode: string,
  merchantName: string
): Promise<FlyerItem[]> {
  const url = `${FLIPP_BASE}/flyers/${flyerId}?locale=en-ca&postal_code=${encodeURIComponent(postalCode)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; GroceryApp/1.0)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Flipp flyer API ${response.status}: ${body.slice(0, 120)}`);
  }

  const data = await response.json();
  const rawItems: FlippFlyerItemRaw[] = Array.isArray(data.items) ? data.items : [];
  return rawItems.map((item) => normalizeFlyerItem(item, merchantName));
}

export async function getFlyers(postalCode: string): Promise<StoreFlyer[]> {
  const url = `${FLIPP_BASE}/flyers?locale=en-ca&postal_code=${encodeURIComponent(
    postalCode
  )}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; GroceryApp/1.0)",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Flipp flyers API returned ${response.status}`);
  }

  const data = await response.json();

  let rawFlyers: FlippFlyerRaw[] = [];
  if (Array.isArray(data)) {
    rawFlyers = data;
  } else if (data && Array.isArray(data.flyers)) {
    rawFlyers = data.flyers;
  } else if (data && typeof data === "object") {
    const keys = Object.keys(data);
    for (const key of keys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        rawFlyers = data[key];
        break;
      }
    }
  }

  return rawFlyers.map((f) => {
    // "merchant" is the store name string; "name" is the flyer title (e.g. "Weekend Flyer")
    const storeName = f.merchant || f.merchant_name || "";
    return {
      id: f.id,
      name: f.name || storeName || "Flyer",
      merchant_name: storeName || f.name || "Unknown Store",
      merchant_id: f.merchant_id ?? null,
      valid_from: f.valid_from || new Date().toISOString(),
      valid_to: f.valid_to || new Date().toISOString(),
      thumbnail_url: f.thumbnail_url || f.merchant_logo || f.logo_url || null,
      items_count: f.items_count || 0,
    };
  });
}
