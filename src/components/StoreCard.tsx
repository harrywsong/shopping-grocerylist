"use client";

import { useState } from "react";
import Image from "next/image";
import { StoreFlyer } from "@/lib/types";

interface StoreCardProps {
  flyer: StoreFlyer;
  onBrowse: (flyer: StoreFlyer) => void;
}

function formatDateRange(from: string, to: string): string {
  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const fromStr = fromDate.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
    });
    const toStr = toDate.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
    });
    return `Valid ${fromStr} – ${toStr}`;
  } catch {
    return "";
  }
}

function isCurrentlyValid(from: string, to: string): boolean {
  try {
    const now = Date.now();
    return now >= new Date(from).getTime() && now <= new Date(to).getTime();
  } catch {
    return false;
  }
}

// Store icon placeholder
function StorePlaceholder({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-clay/40">
      <span className="font-serif text-5xl font-bold text-forest/30">{initial}</span>
    </div>
  );
}

export default function StoreCard({ flyer, onBrowse }: StoreCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const storeName = flyer.merchant_name || flyer.name;
  const dateRange = formatDateRange(flyer.valid_from, flyer.valid_to);
  const isValid = isCurrentlyValid(flyer.valid_from, flyer.valid_to);

  return (
    <div
      className={`group relative bg-clay/20 rounded-3xl border border-stone overflow-hidden flex flex-col
        transition-all duration-500 ease-out shadow-botanical cursor-pointer
        ${isHovered ? "-translate-y-1 shadow-botanical-lg" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onBrowse(flyer)}
      style={{ boxShadow: "0 20px 40px -10px rgba(45, 58, 49, 0.08)" }}
    >
      {/* Active badge */}
      {isValid && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-sage/30 text-sage text-xs font-sans font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          Active
        </div>
      )}

      {/* Logo/thumbnail area */}
      <div className="relative h-40 overflow-hidden rounded-t-3xl bg-clay/30">
        {flyer.thumbnail_url && !imgError ? (
          <Image
            src={flyer.thumbnail_url}
            alt={`${storeName} flyer`}
            fill
            unoptimized
            className={`object-contain p-6 transition-transform duration-700 ease-out ${
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
            <StorePlaceholder name={storeName} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Store name */}
        <h3 className="font-serif text-xl font-semibold text-forest leading-tight">
          {storeName}
        </h3>

        {/* Valid dates */}
        {dateRange && (
          <p className="text-sm text-forest/60 font-sans">{dateRange}</p>
        )}

        {/* Item count */}
        {flyer.items_count > 0 && (
          <p className="text-sm font-sans text-sage font-medium">
            {flyer.items_count.toLocaleString()} deals available
          </p>
        )}

        {/* Browse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBrowse(flyer);
          }}
          className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-sans font-medium uppercase tracking-widest
            transition-all duration-500
            bg-forest text-alabaster hover:bg-sage active:scale-95`}
        >
          Browse Deals
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
