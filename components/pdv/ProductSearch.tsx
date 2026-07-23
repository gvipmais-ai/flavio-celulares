'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { usePDV } from './PDVContext';
import { formatCurrency } from '@/lib/formatters';

export function ProductSearch() {
  const { addToCart, registerShortcut } = usePDV();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus F2
  useEffect(() => {
    registerShortcut('F2', () => {
      inputRef.current?.focus();
    });
  }, [registerShortcut]);

  // Focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&pageSize=10`);
        const data = await res.json();
        setResults(data.data || []);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      const res = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      
      const exact = data.data?.find(
        (p: any) => p.code.toLowerCase() === query.trim().toLowerCase() || p.barcode === query.trim()
      );

      if (exact) {
        addToCart(exact);
        setQuery('');
      } else if (data.data && data.data.length > 0) {
        addToCart(data.data[0]);
        setQuery('');
      }
    }
  };

  const handleSelectProduct = (product: any) => {
    addToCart(product);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Código de barras, referência ou nome (F2 para buscar)..."
          className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 rounded-xl py-4 pl-14 pr-4 text-lg font-medium shadow-sm transition-all text-[var(--text-primary)] placeholder:text-slate-400"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {results.length > 0 && query.trim() && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto">
          {results.map((product) => (
            <div 
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="font-bold text-[var(--text-primary)]">{product.name}</span>
                <span className="text-xs text-slate-500">Cód: {product.code} {product.barcode ? `| Barcode: ${product.barcode}` : ''}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right flex flex-col">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(product.salePrice)}</span>
                  <span className={`text-xs font-bold ${product.stockAvailable > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    Estoque: {product.stockAvailable}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
