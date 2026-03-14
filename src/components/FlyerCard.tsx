"use client";

import { useState } from "react";
import Image from "next/image";
import { FlyerItem } from "@/lib/types";

interface FlyerCardProps {
  readonly item: FlyerItem;
  readonly onAdd: (item: FlyerItem) => void;
  readonly isInList: boolean;
  readonly quantity?: number;
  readonly onQuantityChange?: (item: FlyerItem, delta: number) => void;
}

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  const n = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// Botanical leaf SVG placeholder
function LeafPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-clay/30">
      <svg
        viewBox="0 0 80 80"
        className="w-16 h-16 text-sage/40"
        fill="currentColor"
      >
        <path d="M40 5 C20 5, 5 20, 5 40 C5 58, 18 72, 36 74 C36 74, 35 55, 45 45 C55 35, 74 36, 74 36 C72 18, 58 5, 40 5 Z" />
        <path
          d="M36 74 C36 74, 38 55, 40 40"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function FlyerCard({ item, onAdd, isInList, quantity = 1, onQuantityChange }: FlyerCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = item.cutout_image_url || item.image_url;
  const validTo = formatDate(item.valid_to);

  return (
    <div
      className={`group relative bg-white rounded-3xl border border-stone overflow-hidden flex flex-col cursor-pointer
        transition-all duration-500 ease-out shadow-botanical
        ${isHovered ? "-translate-y-1 shadow-botanical-lg" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ boxShadow: "0 20px 40px -10px rgba(45, 58, 49, 0.08)" }}
    >
      {/* Sale badge */}
      {item.on_sale && item.savings_percentage != null && (
        <div className="absolute top-3 left-3 z-10 bg-terracotta text-white text-xs font-sans font-medium uppercase tracking-wider px-3 py-1 rounded-full">
          Save {item.savings_percentage}%
        </div>
      )}

      {/* Image area */}
      <div className="relative h-48 bg-clay/20 overflow-hidden rounded-t-3xl">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            unoptimized
            className={`object-contain p-4 transition-transform duration-700 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full transition-transform duration-700 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          >
            <LeafPlaceholder />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Store name */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-medium uppercase tracking-widest text-sage">
            {item.store_name}
          </span>
          {validTo && (
            <span className="text-xs text-forest/40 font-sans">
              Until {validTo}
            </span>
          )}
        </div>

        {/* Item name */}
        <h3 className="font-serif text-lg font-semibold text-forest leading-snug line-clamp-2 flex-1">
          {item.name}
        </h3>

        {/* Sale story */}
        {item.sale_story && (
          <p className="text-xs text-forest/50 font-sans leading-relaxed line-clamp-2">
            {item.sale_story}
          </p>
        )}

        {/* Unit */}
        {item.unit && (
          <p className="text-xs text-sage font-sans">{item.unit}</p>
        )}

        {/* Price section */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-serif text-2xl font-bold text-forest">
            {formatPrice(item.price)}
          </span>
          {item.original_price != null && (
            <span className="text-base font-sans text-clay line-through">
              {formatPrice(item.original_price)}
            </span>
          )}
        </div>

        {/* Add / quantity stepper */}
        {isInList ? (
          <div className="flex items-center justify-between gap-2 bg-sage/10 border border-sage/30 rounded-full px-1 py-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={(e) => { e.stopPropagation(); onQuantityChange?.(item, -1); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all duration-300 font-bold text-lg leading-none"
            >
              −
            </button>
            <span className="font-sans font-semibold text-sm text-forest min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={(e) => { e.stopPropagation(); onQuantityChange?.(item, 1); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all duration-300 font-bold text-lg leading-none"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            className="w-full py-2.5 rounded-full text-sm font-sans font-medium uppercase tracking-widest bg-forest text-alabaster hover:bg-sage active:scale-95 transition-all duration-500"
          >
            Add to List
          </button>
        )}
      </div>
    </div>
  );
}
