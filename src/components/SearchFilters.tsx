"use client";

import { useState, useEffect } from "react";

interface FilterState {
  store: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

interface SearchFiltersProps {
  stores: string[];
  currentFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "savings", label: "Best Savings" },
];

export default function SearchFilters({
  stores,
  currentFilters,
  onFilterChange,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const update = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange(next);
  };

  const clearFilters = () => {
    const cleared: FilterState = { store: "", minPrice: "", maxPrice: "", sortBy: "" };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    filters.store || filters.minPrice || filters.maxPrice || filters.sortBy;

  return (
    <div className="space-y-4">
      {/* Store pills — horizontal scroll */}
      <div>
        <p className="text-xs uppercase tracking-widest text-forest/40 font-sans mb-3">
          Filter by Store
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => update("store", "")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans font-medium uppercase tracking-wider transition-all duration-300
              ${
                !filters.store
                  ? "bg-forest text-alabaster"
                  : "bg-white border border-stone text-forest hover:border-sage hover:text-sage"
              }`}
          >
            All Stores
          </button>
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => update("store", filters.store === store ? "" : store)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans font-medium uppercase tracking-wider transition-all duration-300
                ${
                  filters.store === store
                    ? "bg-forest text-alabaster"
                    : "bg-white border border-stone text-forest hover:border-sage hover:text-sage"
                }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>

      {/* Price range + Sort */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Min price */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-forest/40 font-sans">
            Min Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forest/50 font-sans text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={filters.minPrice}
              onChange={(e) => update("minPrice", e.target.value)}
              className="w-28 pl-7 pr-3 py-2 bg-white border-b-2 border-stone text-forest font-sans text-sm
                focus:border-sage rounded-none appearance-none placeholder-forest/25
                transition-colors duration-300"
            />
          </div>
        </div>

        {/* Max price */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-forest/40 font-sans">
            Max Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forest/50 font-sans text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="100.00"
              value={filters.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              className="w-28 pl-7 pr-3 py-2 bg-white border-b-2 border-stone text-forest font-sans text-sm
                focus:border-sage rounded-none appearance-none placeholder-forest/25
                transition-colors duration-300"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-forest/40 font-sans">
            Sort By
          </label>
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => update("sortBy", e.target.value)}
              className="appearance-none bg-white border border-stone rounded-full pl-4 pr-10 py-2
                text-sm font-sans text-forest focus:border-sage focus:ring-1 focus:ring-sage
                transition-colors duration-300 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm font-sans text-terracotta hover:text-forest
              transition-colors duration-300 pb-2 underline underline-offset-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
