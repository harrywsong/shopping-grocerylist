"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navigation from "@/components/Navigation";
import FlyerCard from "@/components/FlyerCard";
import StoreCard from "@/components/StoreCard";
import SearchFilters from "@/components/SearchFilters";
import ShoppingListPanel from "@/components/ShoppingListPanel";
import StorePreferencesPanel from "@/components/StorePreferencesPanel";
import { FlyerItem, StoreFlyer, ShoppingListItem } from "@/lib/types";

type ViewMode = "search" | "browse" | "flyer";

interface FilterState {
  store: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

const DEFAULT_POSTAL = "M2N7C1";

function buildFlyersUrl(
  postalCode: string,
  search: string,
  filters: FilterState
): string {
  const params = new URLSearchParams({ postalCode });
  if (search) params.set("search", search);
  if (filters.store) params.set("store", filters.store);
  if (filters.minPrice) params.set("min_price", filters.minPrice);
  if (filters.maxPrice) params.set("max_price", filters.maxPrice);
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  return `/api/flyers?${params.toString()}`;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [items, setItems] = useState<FlyerItem[]>([]);
  const [flyers, setFlyers] = useState<StoreFlyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [postalCode, setPostalCode] = useState(DEFAULT_POSTAL);
  const [filters, setFilters] = useState<FilterState>({
    store: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "",
  });

  const [selectedFlyer, setSelectedFlyer] = useState<StoreFlyer | null>(null);
  const [favouriteStores, setFavouriteStores] = useState<Set<string>>(new Set());
  const [showStorePreferences, setShowStorePreferences] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load persisted state: localStorage first (instant), then API (authoritative across restarts)
  useEffect(() => {
    try {
      const savedPostal = localStorage.getItem("postalCode");
      if (savedPostal) setPostalCode(savedPostal);
      const savedStores = localStorage.getItem("favouriteStores");
      if (savedStores) setFavouriteStores(new Set(JSON.parse(savedStores)));
    } catch { /* ignore */ }

    // Authoritative load from server file
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (Array.isArray(s.favouriteStores) && s.favouriteStores.length > 0) {
          setFavouriteStores(new Set(s.favouriteStores));
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  // Save postal code to localStorage
  useEffect(() => {
    try { localStorage.setItem("postalCode", postalCode); } catch { /* ignore */ }
  }, [postalCode]);

  // Save favourite stores to both localStorage and server file
  useEffect(() => {
    const list = [...favouriteStores];
    try { localStorage.setItem("favouriteStores", JSON.stringify(list)); } catch { /* ignore */ }
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favouriteStores: list }),
    }).catch(() => { /* ignore */ });
  }, [favouriteStores]);

  // Fetch shopping list on mount
  useEffect(() => {
    fetchShoppingList();
  }, []);

  // Fetch flyers/items when in browse mode or postal changes
  const fetchBrowse = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flyers?postalCode=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      setFlyers(data.flyers || []);
      setItems([]);
    } catch {
      setError("Unable to connect. Please check your internet connection.");
      setFlyers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Default search: load items from each selected store's most-recent active flyer, sorted by savings
  const fetchDefaultItems = useCallback(
    async (code: string, selected: Set<string>, flyersList: StoreFlyer[]) => {
      if (selected.size === 0) { setItems([]); return; }
      setLoading(true);
      setError(null);
      try {
        const now = Date.now();
        const seen = new Set<string>();
        const flyersToFetch: StoreFlyer[] = [];
        for (const f of flyersList) {
          if (!selected.has(f.merchant_name)) continue;
          if (seen.has(f.merchant_name)) continue;
          if (new Date(f.valid_to).getTime() >= now) {
            seen.add(f.merchant_name);
            flyersToFetch.push(f);
          }
        }
        if (flyersToFetch.length === 0) { setItems([]); return; }

        const results = await Promise.all(
          flyersToFetch.map(async (f) => {
            const params = new URLSearchParams({
              postalCode: code,
              flyer_id: String(f.id),
              merchant_name: f.merchant_name,
            });
            const res = await fetch(`/api/flyers?${params.toString()}`);
            const data = await res.json();
            return (data.items ?? []) as FlyerItem[];
          })
        );

        const combined = results.flat();
        combined.sort((a, b) => (b.savings_percentage ?? -1) - (a.savings_percentage ?? -1));
        setItems(combined);
      } catch {
        setError("Unable to load items. Please try again.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch search results
  const fetchSearch = useCallback(
    async (code: string, query: string, currentFilters: FilterState) => {
      if (!query.trim()) return; // empty query handled by fetchDefaultItems
      setLoading(true);
      setError(null);
      try {
        const url = buildFlyersUrl(code, query, currentFilters);
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) setError(data.error);
        setItems(data.items || []);
      } catch {
        setError("Unable to fetch deals. Please try again.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load browse on mount and when postal/mode changes
  useEffect(() => {
    if (viewMode === "browse") {
      fetchBrowse(postalCode);
    }
  }, [viewMode, postalCode, fetchBrowse]);

  // Debounced search — falls back to default items when query is cleared
  useEffect(() => {
    if (viewMode !== "search") return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSearch(postalCode, searchQuery, filters);
      } else {
        fetchDefaultItems(postalCode, favouriteStores, flyers);
      }
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, postalCode, filters, viewMode, fetchSearch, fetchDefaultItems, favouriteStores, flyers]);

  const fetchShoppingList = async () => {
    try {
      const res = await fetch("/api/shopping-list");
      const data = await res.json();
      setShoppingList(data.items || []);
    } catch {
      // silently fail
    }
  };

  const handleAddToList = async (item: FlyerItem) => {
    // Check if already in list
    const alreadyIn = shoppingList.some(
      (li) => String(li.name) === String(item.name) && li.store_name === item.store_name
    );
    if (alreadyIn) return;

    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          store_name: item.store_name,
          price: item.price,
          image_url: item.cutout_image_url || item.image_url,
        }),
      });
      const data = await res.json();
      if (data.item) {
        setShoppingList((prev) => [...prev, data.item]);
      }
    } catch {
      // silently fail
    }
  };

  const getListItem = (item: FlyerItem) =>
    shoppingList.find((li) => li.name === item.name && li.store_name === item.store_name);

  const handleQuantityChangeById = async (id: string, delta: number) => {
    const listItem = shoppingList.find((li) => li.id === id);
    if (!listItem) return;
    const next = (listItem.quantity ?? 1) + delta;
    if (next < 1) { await handleRemoveFromList(id); return; }
    setShoppingList((prev) =>
      prev.map((li) => li.id === id ? { ...li, quantity: next } : li)
    );
    try {
      await fetch("/api/shopping-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: next }),
      });
    } catch { fetchShoppingList(); }
  };

  const handleQuantityChange = (item: FlyerItem, delta: number) => {
    const listItem = getListItem(item);
    if (listItem) handleQuantityChangeById(listItem.id, delta);
  };

  const handleRemoveFromList = async (id: string) => {
    setShoppingList((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch("/api/shopping-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // revert on error
      fetchShoppingList();
    }
  };

  const handleToggleItem = async (id: string) => {
    // Optimistic update
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    try {
      const res = await fetch("/api/shopping-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) fetchShoppingList();
    } catch {
      fetchShoppingList();
    }
  };

  const handleClearList = async () => {
    setShoppingList([]);
    try {
      await fetch("/api/shopping-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
    } catch {
      fetchShoppingList();
    }
  };

  const handleShare = async (): Promise<{ url: string; qr: string } | null> => {
    if (shoppingList.length === 0) return null;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: shoppingList }),
      });
      const data = await res.json();
      if (data.url && data.qr) return { url: data.url, qr: data.qr };
    } catch {
      // ignore
    }
    return null;
  };

  const handlePostalCodeChange = (code: string) => {
    setPostalCode(code);
    setItems([]);
    setFlyers([]);
  };

  const fetchFlyerItems = useCallback(async (flyer: StoreFlyer, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        postalCode: code,
        flyer_id: String(flyer.id),
        merchant_name: flyer.merchant_name,
      });
      const res = await fetch(`/api/flyers?${params.toString()}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      setItems(data.items || []);
    } catch {
      setError("Unable to load flyer items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStoreCardBrowse = (flyer: StoreFlyer) => {
    setSelectedFlyer(flyer);
    setViewMode("flyer");
    setItems([]);
    fetchFlyerItems(flyer, postalCode);
  };

  const handleBackToStores = () => {
    setViewMode("browse");
    setSelectedFlyer(null);
    setItems([]);
  };

  const isInList = (item: FlyerItem): boolean => {
    return shoppingList.some(
      (li) => li.name === item.name && li.store_name === item.store_name
    );
  };

  // Get unique stores from current items
  const availableStores = Array.from(
    new Set(items.map((i) => i.store_name).filter(Boolean))
  );

  // Flyers filtered by user's store preferences (empty set = show all)
  const visibleFlyers = favouriteStores.size === 0
    ? flyers
    : flyers.filter((f) => favouriteStores.has(f.merchant_name));

  const handleFavouritesChange = (next: Set<string>) => {
    setFavouriteStores(next);
  };

  const handleTabChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "browse") {
      setSearchQuery("");
      setItems([]);
      setSelectedFlyer(null);
      setFilters({ store: "", minPrice: "", maxPrice: "", sortBy: "" });
    } else if (mode === "search" && !searchQuery.trim()) {
      fetchDefaultItems(postalCode, favouriteStores, flyers);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster">
      <Navigation
        postalCode={postalCode}
        cartCount={shoppingList.length}
        onCartClick={() => setShowShoppingList(true)}
        onPostalCodeChange={handlePostalCodeChange}
      />

      <main>
        {/* Hero section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-sage/10 text-sage text-xs font-sans uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {postalCode} · Weekly Deals
            </div>

            {/* Main headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-forest leading-[1.1] tracking-tight mb-6">
              This <em className="italic text-sage">Week&apos;s</em>
              <br />
              Best Deals
            </h1>

            <p className="text-lg text-forest/60 font-sans leading-relaxed max-w-xl">
              Browse flyers from your favourite Canadian stores. Search for any item, compare prices, and build a shareable shopping list — all in one place.
            </p>
          </div>

          {/* Search input */}
          <div className="mt-10 max-w-2xl">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-sage">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for chicken, milk, avocados…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setViewMode("search");
                  }
                }}
                className="w-full pl-14 pr-6 py-4 bg-white border border-stone rounded-full text-forest font-sans text-base
                  placeholder-forest/30 focus:border-sage focus:ring-2 focus:ring-sage/20
                  shadow-botanical transition-shadow duration-300 focus:shadow-botanical-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setItems([]);
                    setViewMode("browse");
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone/60 flex items-center justify-center text-forest/50 hover:text-forest hover:bg-stone transition-all duration-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center gap-1 bg-stone/40 rounded-full p-1 w-fit">
            <button
              type="button"
              onClick={() => handleTabChange("browse")}
              className={`px-6 py-2.5 rounded-full text-sm font-sans font-medium uppercase tracking-widest transition-all duration-300
                ${
                  viewMode === "browse"
                    ? "bg-forest text-alabaster shadow-sm"
                    : "text-forest/60 hover:text-forest"
                }`}
            >
              Browse Stores
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("search")}
              className={`px-6 py-2.5 rounded-full text-sm font-sans font-medium uppercase tracking-widest transition-all duration-300
                ${
                  viewMode === "search"
                    ? "bg-forest text-alabaster shadow-sm"
                    : "text-forest/60 hover:text-forest"
                }`}
            >
              Search Items
            </button>
          </div>
        </section>

        {/* Search filters (search mode only) */}
        {viewMode === "search" && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-white rounded-3xl border border-stone p-6 shadow-botanical">
              <SearchFilters
                stores={availableStores}
                currentFilters={filters}
                onFilterChange={setFilters}
              />
            </div>
          </section>
        )}

        {/* Content area */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Error message */}
          {error && (
            <div className="mb-8 bg-terracotta/10 border border-terracotta/20 rounded-2xl px-6 py-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-terracotta mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-forest/70 font-sans">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-stone border-t-sage animate-spin" />
              <p className="text-sm text-forest/50 font-sans uppercase tracking-widest">
                {viewMode === "browse" ? "Loading flyers…" : "Searching deals…"}
              </p>
            </div>
          )}

          {/* Flyer items mode: items from a specific store flyer */}
          {!loading && viewMode === "flyer" && selectedFlyer && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleBackToStores}
                  className="flex items-center gap-2 text-sm font-sans text-forest/60 hover:text-forest uppercase tracking-widest transition-colors duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  All Stores
                </button>
                <span className="text-forest/20">/</span>
                <h2 className="font-serif text-2xl font-semibold text-forest">
                  {selectedFlyer.merchant_name || selectedFlyer.name}
                </h2>
              </div>
              {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <FlyerCard
                      key={`${item.id}-${item.store_name}`}
                      item={item}
                      onAdd={handleAddToList}
                      isInList={isInList(item)}
                      quantity={getListItem(item)?.quantity ?? 1}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              ) : (
                !error && (
                  <div className="py-24 flex flex-col items-center gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-clay/40 flex items-center justify-center">
                      <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-forest">No items found</h3>
                    <p className="text-forest/50 font-sans max-w-sm">
                      This flyer has no available items right now.
                    </p>
                  </div>
                )
              )}
            </>
          )}

          {/* Browse mode: Store cards */}
          {!loading && viewMode === "browse" && (
            <>
              {flyers.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-semibold text-forest">
                      <em className="italic">{visibleFlyers.length}</em>
                      {favouriteStores.size > 0 ? ` of ${flyers.length}` : ""} Flyers Available
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowStorePreferences(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-sans uppercase tracking-widest transition-all duration-300 border
                        ${favouriteStores.size > 0
                          ? "bg-forest text-alabaster border-forest"
                          : "bg-white text-forest/70 border-stone hover:border-forest/40 hover:text-forest"
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                      </svg>
                      {favouriteStores.size > 0 ? `${favouriteStores.size} stores` : "Filter"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {visibleFlyers.map((flyer) => (
                      <StoreCard
                        key={flyer.id}
                        flyer={flyer}
                        onBrowse={handleStoreCardBrowse}
                      />
                    ))}
                  </div>
                </>
              ) : (
                !error && (
                  <div className="py-24 flex flex-col items-center gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-clay/40 flex items-center justify-center">
                      <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-forest">
                      No flyers found
                    </h3>
                    <p className="text-forest/50 font-sans max-w-sm">
                      No flyers found for postal code <strong>{postalCode}</strong>. Try a different postal code.
                    </p>
                  </div>
                )
              )}
            </>
          )}

          {/* Search mode: Item cards */}
          {!loading && viewMode === "search" && (
            <>
              {/* No stores selected and no query — prompt user to select stores */}
              {searchQuery.trim() === "" && favouriteStores.size === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-clay/40 flex items-center justify-center">
                    <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-forest">Select your stores first</h3>
                  <p className="text-forest/50 font-sans max-w-sm">
                    Go to <strong>Browse Stores</strong>, click <em>Filter</em>, and pick which stores to follow — then deals from those stores will appear here automatically.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange("browse")}
                    className="mt-2 px-6 py-2.5 bg-forest text-alabaster rounded-full text-sm font-sans uppercase tracking-widest hover:bg-sage transition-all duration-300"
                  >
                    Browse Stores
                  </button>
                </div>
              ) : items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-semibold text-forest">
                      {searchQuery.trim() ? (
                        <><em className="italic">{items.length}</em>{" "}{items.length === 1 ? "result" : "results"} for &ldquo;{searchQuery}&rdquo;</>
                      ) : (
                        <><em className="italic">{items.length}</em> deals · biggest savings first</>
                      )}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <FlyerCard
                        key={`${item.id}-${item.store_name}`}
                        item={item}
                        onAdd={handleAddToList}
                        isInList={isInList(item)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                !error && (
                  <div className="py-24 flex flex-col items-center gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-clay/40 flex items-center justify-center">
                      <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-forest">
                      No results found
                    </h3>
                    <p className="text-forest/50 font-sans max-w-sm">
                      No deals found for &ldquo;{searchQuery}&rdquo; in <strong>{postalCode}</strong>. Try a different search term or postal code.
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </section>
      </main>

      {/* Floating cart button (mobile) */}
      {shoppingList.length > 0 && !showShoppingList && (
        <button
          type="button"
          onClick={() => setShowShoppingList(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 bg-forest text-alabaster
            pl-5 pr-4 py-3 rounded-full shadow-botanical-lg hover:bg-sage active:scale-95
            transition-all duration-500 sm:hidden"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-sans font-medium uppercase tracking-wider">
            My List
          </span>
          <span className="w-6 h-6 bg-terracotta text-white text-xs font-medium rounded-full flex items-center justify-center">
            {shoppingList.length}
          </span>
        </button>
      )}

      {/* Shopping list panel */}
      {showShoppingList && (
        <ShoppingListPanel
          items={shoppingList}
          onRemove={handleRemoveFromList}
          onToggle={handleToggleItem}
          onQuantityChange={handleQuantityChangeById}
          onClear={handleClearList}
          onShare={handleShare}
          onClose={() => setShowShoppingList(false)}
        />
      )}

      {/* Store preferences panel */}
      {showStorePreferences && (
        <StorePreferencesPanel
          flyers={flyers}
          favourites={favouriteStores}
          onFavouritesChange={handleFavouritesChange}
          onClose={() => setShowStorePreferences(false)}
        />
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed z-30 w-11 h-11 rounded-full bg-white border border-stone shadow-botanical flex items-center justify-center text-forest/60 hover:text-forest hover:border-sage hover:shadow-botanical-lg active:scale-95 transition-all duration-300
            ${shoppingList.length > 0 && !showShoppingList ? "bottom-20 sm:bottom-6" : "bottom-6"} right-6`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
