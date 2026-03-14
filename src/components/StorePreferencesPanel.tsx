"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { StoreFlyer } from "@/lib/types";

interface StorePreferencesPanelProps {
  flyers: StoreFlyer[];
  favourites: Set<string>;
  onFavouritesChange: (favourites: Set<string>) => void;
  onClose: () => void;
}

/** One entry per unique merchant (deduplicated from the full flyers list) */
interface MerchantEntry {
  name: string;
  logo: string | null;
  flyerCount: number;
}

function buildMerchantList(flyers: StoreFlyer[]): MerchantEntry[] {
  const map = new Map<string, MerchantEntry>();
  for (const f of flyers) {
    const key = f.merchant_name;
    if (!map.has(key)) {
      map.set(key, { name: key, logo: f.thumbnail_url, flyerCount: 1 });
    } else {
      const entry = map.get(key)!;
      entry.flyerCount += 1;
      // Prefer a non-null logo
      if (!entry.logo && f.thumbnail_url) entry.logo = f.thumbnail_url;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function MerchantRow({
  merchant,
  selected,
  onToggle,
}: {
  merchant: MerchantEntry;
  selected: boolean;
  onToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all duration-300 text-left
        ${selected
          ? "bg-forest/5 border-forest/20"
          : "bg-white border-stone hover:border-sage/40"
        }`}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-clay/30 flex items-center justify-center">
        {merchant.logo && !imgError ? (
          <Image
            src={merchant.logo}
            alt={merchant.name}
            width={40}
            height={40}
            unoptimized
            className="object-contain w-full h-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-serif text-lg font-bold text-forest/30">
            {merchant.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Name + count */}
      <div className="flex-1 min-w-0">
        <p className="font-sans font-medium text-sm text-forest truncate">{merchant.name}</p>
        <p className="font-sans text-xs text-forest/40">
          {merchant.flyerCount} {merchant.flyerCount === 1 ? "flyer" : "flyers"}
        </p>
      </div>

      {/* Toggle indicator */}
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300
        ${selected ? "bg-forest border-forest" : "border-stone bg-white"}`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-alabaster" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

export default function StorePreferencesPanel({
  flyers,
  favourites,
  onFavouritesChange,
  onClose,
}: StorePreferencesPanelProps) {
  const [localFavourites, setLocalFavourites] = useState<Set<string>>(
    () => new Set(favourites)
  );
  const [search, setSearch] = useState("");

  const merchants = useMemo(() => buildMerchantList(flyers), [flyers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return merchants;
    const q = search.toLowerCase();
    return merchants.filter((m) => m.name.toLowerCase().includes(q));
  }, [merchants, search]);

  const allSelected = localFavourites.size === 0;
  const selectedCount = localFavourites.size;

  const toggle = (name: string) => {
    setLocalFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setLocalFavourites(new Set());

  const apply = () => {
    onFavouritesChange(new Set(localFavourites));
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-forest/20 backdrop-blur-sm"
        onClick={apply}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-alabaster shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone">
          <div>
            <h2 className="font-serif text-xl font-semibold text-forest">
              Filter <em className="italic">Stores</em>
            </h2>
            <p className="text-xs font-sans text-forest/50 mt-0.5">
              {allSelected
                ? "Showing all stores"
                : `${selectedCount} of ${merchants.length} selected`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={apply}
            className="w-8 h-8 rounded-full bg-stone/50 flex items-center justify-center text-forest/60 hover:text-forest hover:bg-stone transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + select-all */}
        <div className="px-6 py-4 space-y-3 border-b border-stone">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search stores…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone rounded-full text-sm font-sans text-forest placeholder-forest/30 focus:border-sage focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className={`px-4 py-1.5 rounded-full text-xs font-sans uppercase tracking-widest transition-all duration-300
                ${allSelected ? "bg-forest text-alabaster" : "bg-stone/50 text-forest/60 hover:text-forest"}`}
            >
              All Stores
            </button>
            {!allSelected && (
              <span className="text-xs font-sans text-forest/40">
                {selectedCount} selected
              </span>
            )}
          </div>
        </div>

        {/* Merchant list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {filtered.map((merchant) => (
            <MerchantRow
              key={merchant.name}
              merchant={merchant}
              selected={localFavourites.has(merchant.name)}
              onToggle={() => toggle(merchant.name)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm font-sans text-forest/40 py-8">
              No stores match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-stone">
          <button
            type="button"
            onClick={apply}
            className="w-full py-3 bg-forest text-alabaster rounded-full text-sm font-sans font-medium uppercase tracking-widest hover:bg-sage active:scale-95 transition-all duration-300"
          >
            {allSelected ? "Show All Stores" : `Show ${selectedCount} Store${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </>
  );
}
