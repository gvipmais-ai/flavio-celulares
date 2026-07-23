'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  stockAvailable: number;
}

export interface PaymentMethod {
  method: string;
  amount: number;
}

interface PDVContextData {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  customerName: string;
  setCustomerName: (name: string) => void;
  customerCpf: string;
  setCustomerCpf: (cpf: string) => void;

  payments: PaymentMethod[];
  addPayment: (method: string, amount: number) => void;
  removePayment: (index: number) => void;
  clearPayments: () => void;

  generalDiscount: number;
  setGeneralDiscount: (amount: number) => void;

  grossTotal: number;
  totalDiscount: number;
  netTotal: number;
  totalPaid: number;
  change: number;
  remainingToPay: number;

  cashSession: any;
  setCashSession: (session: any) => void;
  isLoadingSession: boolean;
  setIsLoadingSession: (val: boolean) => void;
  reloadSession: () => Promise<void>;
  
  settings: any;

  // Shortcuts
  registerShortcut: (key: string, callback: () => void) => void;
  unregisterShortcut: (key: string) => void;
}

const PDVContext = createContext<PDVContextData>({} as PDVContextData);

export function PDVProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente Consumidor');
  const [customerCpf, setCustomerCpf] = useState('');
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState(0);

  const [cashSession, setCashSession] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Keyboard Shortcuts map
  const shortcutsRef = React.useRef<Map<string, () => void>>(new Map());

  const registerShortcut = useCallback((key: string, callback: () => void) => {
    shortcutsRef.current.set(key, callback);
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    shortcutsRef.current.delete(key);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isFKey = e.key.match(/^F[1-9][0-2]?$/);
      if (isFKey || e.key === 'Escape') {
        const handler = shortcutsRef.current.get(e.key);
        if (handler) {
          e.preventDefault();
          handler();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Session and Settings
  const reloadSession = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const [resSession, resSettings] = await Promise.all([
        fetch('/api/cash-sessions/current', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);
      if (resSession.ok) {
        const data = await resSession.json();
        setCashSession(data.session);
      } else {
        setCashSession(null);
      }
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data.settings);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    reloadSession();
  }, [reloadSession]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pdvStateV2');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.cart) setCart(p.cart);
        if (p.customerName) setCustomerName(p.customerName);
        if (p.customerCpf) setCustomerCpf(p.customerCpf);
        if (p.payments) setPayments(p.payments);
        if (p.generalDiscount) setGeneralDiscount(p.generalDiscount);
      } catch (e) {
        console.error('Failed to parse pdv state');
      }
    }
    setIsReady(true);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('pdvStateV2', JSON.stringify({
        cart, customerName, customerCpf, payments, generalDiscount
      }));
    }
  }, [cart, customerName, customerCpf, payments, generalDiscount, isReady]);

  // Cart actions
  const addToCart = (product: any, qty = 1) => {
    if (product.stockAvailable < qty) {
      toast.error(`Produto "${product.name}" não tem estoque suficiente.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity + qty > product.stockAvailable) {
          toast.error(`Estoque máximo disponível: ${product.stockAvailable}`);
          return prev;
        }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        productId: product.id,
        code: product.code || product.barcode || 'S/N',
        name: product.name,
        unitPrice: Number(product.salePrice),
        quantity: qty,
        discount: 0,
        stockAvailable: product.stockAvailable
      }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(i => {
      if (i.productId === productId) {
        if (qty > i.stockAvailable) {
          toast.error(`Estoque máximo disponível: ${i.stockAvailable}`);
          return i;
        }
        return { ...i, quantity: qty };
      }
      return i;
    }));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, discount } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPayments([]);
    setGeneralDiscount(0);
    setCustomerName('Cliente Consumidor');
    setCustomerCpf('');
  };

  const addPayment = (method: string, amount: number) => {
    setPayments(prev => {
      // If payment method already exists, add to it
      const existing = prev.find(p => p.method === method);
      if (existing) {
        return prev.map(p => p.method === method ? { ...p, amount: p.amount + amount } : p);
      }
      return [...prev, { method, amount }];
    });
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const clearPayments = () => {
    setPayments([]);
  };

  // Math
  const grossTotal = cart.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const itemsDiscount = cart.reduce((acc, i) => acc + i.discount, 0);
  const totalDiscount = itemsDiscount + generalDiscount;
  const netTotal = Math.max(0, grossTotal - totalDiscount);
  
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const change = Math.max(0, totalPaid - netTotal);
  const remainingToPay = Math.max(0, netTotal - totalPaid);

  return (
    <PDVContext.Provider value={{
      cart, addToCart, updateQuantity, updateDiscount, removeFromCart, clearCart,
      customerName, setCustomerName, customerCpf, setCustomerCpf,
      payments, addPayment, removePayment, clearPayments,
      generalDiscount, setGeneralDiscount,
      grossTotal, totalDiscount, netTotal, totalPaid, change, remainingToPay,
      cashSession, setCashSession, isLoadingSession, setIsLoadingSession, reloadSession, settings,
      registerShortcut, unregisterShortcut
    }}>
      {children}
    </PDVContext.Provider>
  );
}

export const usePDV = () => useContext(PDVContext);
