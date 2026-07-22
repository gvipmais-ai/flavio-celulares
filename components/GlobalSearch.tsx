'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, FileText, ShoppingCart, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'PRODUCT' | 'SALE' | 'CUSTOMER' | 'OS';
  title: string;
  subtitle: string;
  link: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT': return <Package className="h-4 w-4 text-blue-400" />;
      case 'SALE': return <ShoppingCart className="h-4 w-4 text-emerald-400" />;
      case 'CUSTOMER': return <Users className="h-4 w-4 text-indigo-400" />;
      case 'OS': return <FileText className="h-4 w-4 text-amber-400" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar produtos, vendas, OS..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-1.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-2 shadow-xl z-50">
          {results.length === 0 && !isLoading ? (
            <p className="p-4 text-center text-sm text-slate-400">Nenhum resultado encontrado.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((res) => (
                <Link
                  key={`${res.type}-${res.id}`}
                  href={res.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900">
                    {getIcon(res.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{res.title}</p>
                    <p className="truncate text-xs text-slate-400">{res.subtitle}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
