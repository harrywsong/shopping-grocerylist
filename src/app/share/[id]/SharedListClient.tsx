"use client";

import { useState } from "react";
import { ShoppingListItem } from "@/lib/types";

interface SharedListClientProps {
  items: ShoppingListItem[];
  createdAt: string;
  expiresAt: string;
}

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return `$${price.toFixed(2)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function SharedListClient({ items: initialItems, createdAt, expiresAt }: SharedListClientProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedByStore: Record<string, ShoppingListItem[]> = {};
  for (const item of initialItems) {
    if (!groupedByStore[item.store_name]) groupedByStore[item.store_name] = [];
    groupedByStore[item.store_name].push(item);
  }

  const total = initialItems.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const checkedCount = checked.size;

  return (
    <>
      {/* Summary card */}
      <div className="bg-white rounded-3xl border border-stone shadow-botanical p-6 mb-10 flex flex-wrap gap-6 justify-between items-center">
        <div>
          <div className="text-xs uppercase tracking-widest text-forest/40 font-sans mb-1">Estimated Total</div>
          <div className="text-3xl font-serif font-semibold text-forest">{formatPrice(total)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-forest/40 font-sans mb-1">Items</div>
          <div className="text-xl font-serif font-semibold text-forest">
            {checkedCount}/{initialItems.length} checked
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-forest/40 font-sans mb-1">Shared On</div>
          <div className="text-sm text-forest/70 font-sans">{formatDate(createdAt)}</div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-sage/10 border border-sage/20 rounded-2xl px-6 py-4 mb-10 flex items-start gap-3">
        <svg className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-forest/70 font-sans leading-relaxed">
          <strong className="text-forest font-medium">Start Shopping:</strong> Visit each store below to find the items on this list. Prices are from this week&apos;s flyers and may vary. This list expires{" "}
          {formatDate(expiresAt)}.
        </p>
      </div>

      {/* Items by store */}
      <div className="space-y-8">
        {Object.entries(groupedByStore).map(([storeName, storeItems]) => {
          const storeTotal = storeItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
          return (
            <div key={storeName} className="bg-white rounded-3xl border border-stone shadow-botanical overflow-hidden">
              {/* Store header */}
              <div className="bg-clay/30 px-6 py-4 flex items-center justify-between border-b border-stone">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-forest">{storeName}</h2>
                    <p className="text-xs text-forest/50 font-sans">
                      {storeItems.length} {storeItems.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-forest/40 font-sans">Subtotal</div>
                  <div className="font-serif text-lg font-semibold text-forest">{formatPrice(storeTotal)}</div>
                </div>
              </div>

              {/* Items */}
              <ul className="divide-y divide-stone">
                {storeItems.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={`w-full px-6 py-4 flex items-center gap-4 text-left transition-colors duration-200 hover:bg-stone/30 ${isChecked ? "opacity-60" : ""}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                            isChecked ? "bg-sage border-sage" : "border-stone"
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-sans text-base ${isChecked ? "line-through text-forest/40" : "text-forest"}`}>
                            {item.name}
                          </p>
                          {(item.quantity ?? 1) > 1 && (
                            <p className="text-xs text-forest/40 font-sans mt-0.5">Qty: {item.quantity}</p>
                          )}
                        </div>
                        <div className="font-serif text-lg font-semibold text-forest flex-shrink-0">
                          {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
