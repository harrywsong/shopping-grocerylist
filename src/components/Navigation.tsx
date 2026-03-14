"use client";

import { useState } from "react";
import Link from "next/link";

interface NavigationProps {
  postalCode: string;
  cartCount: number;
  onCartClick: () => void;
  onPostalCodeChange: (code: string) => void;
}

export default function Navigation({
  postalCode,
  cartCount,
  onCartClick,
  onPostalCodeChange,
}: NavigationProps) {
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalInput, setPostalInput] = useState(postalCode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePostalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = postalInput.replace(/\s/g, "").toUpperCase();
    if (cleaned.length >= 3) {
      onPostalCodeChange(cleaned);
      setEditingPostal(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-alabaster/90 backdrop-blur-md border-b border-stone">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="font-serif text-2xl font-semibold text-forest tracking-tight">
              Shopping |<em className="italic text-sage"> Grocery Flyers & Deals</em>
            </span>
          </Link>

          {/* Desktop: Postal + Cart */}
          <div className="hidden sm:flex items-center gap-4">
            {editingPostal ? (
              <form onSubmit={handlePostalSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={postalInput}
                  onChange={(e) => setPostalInput(e.target.value)}
                  placeholder="Postal code"
                  maxLength={7}
                  autoFocus
                  className="w-32 px-3 py-1.5 text-sm font-sans bg-white border border-stone rounded-full text-forest placeholder-forest/30 focus:border-sage focus:ring-1 focus:ring-sage"
                />
                <button
                  type="submit"
                  className="text-xs uppercase tracking-widest font-sans font-medium text-white bg-forest px-4 py-1.5 rounded-full hover:bg-sage transition-colors duration-500"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostal(false);
                    setPostalInput(postalCode);
                  }}
                  className="text-xs text-forest/50 hover:text-forest transition-colors duration-300 font-sans"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingPostal(true)}
                className="flex items-center gap-2 text-sm font-sans text-forest/70 hover:text-forest transition-colors duration-300 group"
              >
                <svg
                  className="w-4 h-4 text-sage"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="group-hover:underline underline-offset-2">{postalCode}</span>
              </button>
            )}

            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-forest text-alabaster uppercase tracking-widest text-xs font-sans font-medium px-5 py-2.5 rounded-full hover:bg-sage transition-colors duration-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              My List
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-terracotta text-white text-xs font-sans font-medium rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: Cart + Hamburger */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              onClick={onCartClick}
              className="relative p-2 text-forest"
              aria-label="Shopping list"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-terracotta text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-forest"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-stone py-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-forest/70 font-sans">
              <svg className="w-4 h-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Location: {postalCode}</span>
            </div>
            {editingPostal ? (
              <form onSubmit={handlePostalSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={postalInput}
                  onChange={(e) => setPostalInput(e.target.value)}
                  placeholder="Postal code"
                  maxLength={7}
                  autoFocus
                  className="flex-1 px-3 py-2 text-sm font-sans bg-white border border-stone rounded-full text-forest placeholder-forest/30"
                />
                <button
                  type="submit"
                  className="text-xs uppercase tracking-widest font-sans font-medium text-white bg-forest px-4 py-2 rounded-full"
                >
                  Go
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingPostal(true)}
                className="text-sm font-sans text-terracotta underline underline-offset-2"
              >
                Change location
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
