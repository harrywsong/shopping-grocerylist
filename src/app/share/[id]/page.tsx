import { Metadata } from "next";
import Link from "next/link";
import { ShoppingListItem } from "@/lib/types";
import SharedListClient from "./SharedListClient";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Shared Shopping List`,
    description: "View a shared grocery shopping list.",
  };
}

async function getSharedList(id: string, baseUrl: string): Promise<{
  items: ShoppingListItem[];
  created_at: string;
  expires_at: string;
} | null> {
  try {
    const res = await fetch(`${baseUrl}/api/share?id=${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: PageProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://40.233.95.61:3000");

  const data = await getSharedList(params.id, baseUrl);

  if (!data) {
    return (
      <div className="min-h-screen bg-alabaster flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-clay flex items-center justify-center">
            <svg className="w-10 h-10 text-forest opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-forest mb-3">List Not Found</h1>
          <p className="text-forest/60 font-sans mb-8 leading-relaxed">
            This shared shopping list has expired or doesn&apos;t exist. Shared lists are available for 6 hours after creation.
          </p>
          <Link
            href="/"
            className="inline-block bg-forest text-alabaster uppercase tracking-widest text-sm font-sans font-medium px-8 py-3 rounded-full hover:bg-sage transition-colors duration-500"
          >
            Browse Deals
          </Link>
        </div>
      </div>
    );
  }

  const { items, created_at, expires_at } = data;
  const storeCount = new Set(items.map((i) => i.store_name)).size;

  return (
    <div className="min-h-screen bg-alabaster">
      {/* Header */}
      <header className="bg-white border-b border-stone sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-semibold text-forest">
            Shopping |<em className="italic"> Grocery Flyers & Deals</em>
          </Link>
          <span className="text-sm text-forest/50 font-sans">Shared List</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-sage/10 text-sage text-xs font-sans uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Shared Shopping List
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-forest leading-tight mb-4">
            Ready to <em className="italic text-sage">Shop?</em>
          </h1>
          <p className="text-forest/60 font-sans text-lg">
            {items.length} {items.length === 1 ? "item" : "items"} across {storeCount}{" "}
            {storeCount === 1 ? "store" : "stores"}
          </p>
        </div>

        <SharedListClient items={items} createdAt={created_at} expiresAt={expires_at} />

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-block bg-forest text-alabaster uppercase tracking-widest text-sm font-sans font-medium px-10 py-4 rounded-full hover:bg-sage transition-colors duration-500 shadow-botanical"
          >
            Find Your Own Deals
          </Link>
        </div>
      </main>
    </div>
  );
}
