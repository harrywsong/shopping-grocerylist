"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingListItem } from "@/lib/types";

interface ShoppingListPanelProps {
  readonly items: ShoppingListItem[];
  readonly onRemove: (id: string) => void;
  readonly onToggle: (id: string) => void;
  readonly onQuantityChange: (id: string, delta: number) => void;
  readonly onClear: () => void;
  readonly onShare: () => Promise<{ url: string; qr: string } | null>;
  readonly onClose: () => void;
}

function formatPrice(price: number | null): string {
  if (price == null) return "";
  return `$${price.toFixed(2)}`;
}

export default function ShoppingListPanel({
  items,
  onRemove,
  onToggle,
  onQuantityChange,
  onClear,
  onShare,
  onClose,
}: ShoppingListPanelProps) {
  const [shareLoading, setShareLoading] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; qr: string } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const groupedByStore: Record<string, ShoppingListItem[]> = {};
  for (const item of items) {
    if (!groupedByStore[item.store_name]) groupedByStore[item.store_name] = [];
    groupedByStore[item.store_name].push(item);
  }

  const total = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const checkedCount = items.filter((i) => i.checked).length;

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const result = await onShare();
      if (result) { setShareData(result); setShowQR(true); }
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-forest/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-alabaster border-l border-stone flex flex-col shadow-[−30px_0_60px_−15px_rgba(45,58,49,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone bg-white">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-forest italic">Shopping List</h2>
            {items.length > 0 && (
              <p className="text-sm text-forest/50 font-sans mt-0.5">
                {checkedCount}/{items.length} items checked
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-stone/50 flex items-center justify-center hover:bg-stone transition-colors duration-300 text-forest"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-clay/40 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold text-forest mb-2">Your list is empty</h3>
              <p className="text-sm text-forest/50 font-sans leading-relaxed">
                Search for grocery items and tap &ldquo;Add to List&rdquo; to build your shopping list.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone">
              {Object.entries(groupedByStore).map(([storeName, storeItems]) => (
                <div key={storeName}>
                  {/* Store header */}
                  <div className="px-6 py-3 bg-clay/20 flex items-center gap-2">
                    <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-xs font-sans font-medium uppercase tracking-widest text-forest/60">{storeName}</span>
                    <span className="ml-auto text-xs text-forest/40 font-sans">
                      {storeItems.length} {storeItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Items */}
                  {storeItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-6 py-3 hover:bg-stone/30 transition-colors duration-200 group ${item.checked ? "opacity-60" : ""}`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggle(item.id)}
                        aria-label={item.checked ? "Uncheck item" : "Check item"}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300
                          ${item.checked ? "bg-sage border-sage" : "border-stone hover:border-sage"}`}
                      >
                        {item.checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Thumbnail */}
                      {item.image_url && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-clay/30 flex-shrink-0">
                          <Image src={item.image_url} alt={item.name} width={36} height={36} unoptimized className="w-full h-full object-contain p-1" />
                        </div>
                      )}

                      {/* Name + price */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-sans text-forest leading-snug truncate ${item.checked ? "line-through text-forest/40" : ""}`}>
                          {item.name}
                        </p>
                        {item.price != null && (
                          <p className="text-xs text-sage font-sans font-medium mt-0.5">
                            {formatPrice(item.price)}{(item.quantity ?? 1) > 1 ? ` × ${item.quantity} = ${formatPrice(item.price * (item.quantity ?? 1))}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => onQuantityChange(item.id, -1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-forest/40 hover:bg-stone hover:text-forest transition-all duration-200 text-base font-bold leading-none"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-sans font-semibold text-forest">
                          {item.quantity ?? 1}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => onQuantityChange(item.id, 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-forest/40 hover:bg-stone hover:text-forest transition-all duration-200 text-base font-bold leading-none"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label="Remove item"
                        className="w-7 h-7 rounded-full flex items-center justify-center text-forest/30 hover:text-terracotta hover:bg-terracotta/10 transition-all duration-300 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone bg-white px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-forest/60 uppercase tracking-widest">Est. Total</span>
              <span className="font-serif text-2xl font-semibold text-forest">${total.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-terracotta text-white uppercase tracking-widest text-xs font-sans font-medium py-3 rounded-full hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                {shareLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                  </svg>
                )}
                Share via QR
              </button>
              <button
                type="button"
                onClick={onClear}
                className="px-5 py-3 rounded-full text-xs font-sans font-medium uppercase tracking-widest border border-stone text-forest/60 hover:border-terracotta hover:text-terracotta transition-all duration-300"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && shareData && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
          <div className="absolute inset-0 bg-forest/40 backdrop-blur-sm" onClick={() => setShowQR(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-3xl border border-stone p-8 max-w-sm w-full text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setShowQR(false)}
              aria-label="Close QR modal"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone/50 flex items-center justify-center hover:bg-stone text-forest transition-colors duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="font-serif text-2xl font-semibold text-forest italic mb-2">Scan to Share</h3>
            <p className="text-sm text-forest/50 font-sans mb-6">This link expires in 6 hours</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shareData.qr} alt="QR code for shared list" className="w-48 h-48 mx-auto rounded-2xl border border-stone" />
            <div className="mt-6 bg-alabaster rounded-2xl border border-stone p-3 flex items-center gap-2">
              <p className="flex-1 text-xs font-sans text-forest/60 truncate">{shareData.url}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-shrink-0 text-xs font-sans font-medium text-sage hover:text-forest transition-colors duration-300 uppercase tracking-wider"
              >
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
