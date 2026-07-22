'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  CheckCircle,
  Loader2,
  X,
  ShieldCheck,
  FileText,
  Gift,
  Percent,
  DollarSign,
  RotateCcw,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, calcChange, formatPaymentMethod } from '@/lib/formatters';

interface CartItem {
  productId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
  stockAvailable: number;
  warrantyMonths?: number;
}

export default function CaixaPage() {
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Venda State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente Consumidor');
  const [customerCpf, setCustomerCpf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('DINHEIRO');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Desconto Livre (Percentual ou Valor Fixo)
  const [discountMode, setDiscountMode] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [discountInputValue, setDiscountInputValue] = useState<number>(0);

  // Modal de Comprovante Térmico & Termo de Garantia
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'RECEIPT' | 'WARRANTY'>('RECEIPT');

  // Fechamento de Caixa State
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showClosedReceiptModal, setShowClosedReceiptModal] = useState(false);
  const [informedCashAmount, setInformedCashAmount] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [closedCashReportData, setClosedCashReportData] = useState<any>(null);
  const [isClosingCash, setIsClosingCash] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const [resSession, resSettings] = await Promise.all([
        fetch('/api/cash-sessions/current', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);
      const dataSession = await resSession.json();
      const dataSettings = await resSettings.json();

      setSession(dataSession.session);
      setSettings(dataSettings.settings);
    } catch {
      toast.error('Erro ao carregar dados do caixa');
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Restore State on mount
  useEffect(() => {
    const savedState = localStorage.getItem('flavioCaixaState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerCpf) setCustomerCpf(parsed.customerCpf);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.receivedAmount) setReceivedAmount(parsed.receivedAmount);
        if (parsed.discountMode) setDiscountMode(parsed.discountMode);
        if (parsed.discountInputValue !== undefined) setDiscountInputValue(parsed.discountInputValue);
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
    setIsStateLoaded(true);
  }, []);

  // Auto-Save State
  useEffect(() => {
    if (isStateLoaded) {
      localStorage.setItem('flavioCaixaState', JSON.stringify({
        cart,
        customerName,
        customerCpf,
        paymentMethod,
        receivedAmount,
        discountMode,
        discountInputValue
      }));
    }
  }, [cart, customerName, customerCpf, paymentMethod, receivedAmount, discountMode, discountInputValue, isStateLoaded]);

  useEffect(() => {
    if (session && barcodeInputRef.current && !showThermalModal && !showCloseCashModal) {
      barcodeInputRef.current.focus();
    }
  }, [session, showThermalModal, showCloseCashModal]);

  const handleOpenCash = async () => {
    try {
      const res = await fetch('/api/cash-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao abrir caixa');
        return;
      }
      toast.success('Caixa aberto com sucesso!');
      loadData();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const searchProduct = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&pageSize=5`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch {
      // silent
    }
  };

  const addToCart = (product: any) => {
    if (product.stockAvailable <= 0) {
      toast.error(`Produto "${product.name}" sem estoque disponível!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stockAvailable) {
          toast.error(`Estoque máximo disponível: ${product.stockAvailable}`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          unitPrice: Number(product.salePrice),
          quantity: 1,
          discount: 0,
          subtotal: Number(product.salePrice),
          stockAvailable: product.stockAvailable,
          warrantyMonths: product.warrantyMonths || 3,
        },
      ];
    });

    setSearchQuery('');
    setSearchResults([]);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      const exact = data.data?.find(
        (p: any) => p.code.toLowerCase() === searchQuery.trim().toLowerCase() || p.barcode === searchQuery.trim()
      );

      if (exact) {
        addToCart(exact);
      } else if (data.data && data.data.length > 0) {
        addToCart(data.data[0]);
      } else {
        toast.error('Produto não encontrado');
      }
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Cálculo de Subtotal Bruto
  const grossTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Cálculo do Desconto Livre
  let calculatedDiscount = 0;
  if (discountMode === 'PERCENT') {
    const pct = Math.min(100, Math.max(0, discountInputValue));
    calculatedDiscount = (grossTotal * pct) / 100;
  } else {
    calculatedDiscount = Math.min(grossTotal, Math.max(0, discountInputValue));
  }

  const finalTotal = Math.max(0, grossTotal - calculatedDiscount);

  // Troco
  const change =
    paymentMethod === 'BRINDE'
      ? 0
      : paymentMethod === 'DINHEIRO'
      ? calcChange(receivedAmount, finalTotal)
      : 0;

  // Atalhos
  const handleApply100PercentOff = () => {
    setDiscountMode('PERCENT');
    setDiscountInputValue(100);
    toast.success('Desconto de 100% aplicado! Valor total R$ 0,00');
  };

  const handleClearDiscount = () => {
    setDiscountInputValue(0);
    toast.info('Desconto removido');
  };

  const handleSelectPaymentMethod = (method: string) => {
    setPaymentMethod(method);
    if (method === 'BRINDE') {
      setReceivedAmount(finalTotal);
    }
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast.error('O carrinho está vazio');
      return;
    }
    if (!customerName) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (paymentMethod === 'DINHEIRO' && receivedAmount < finalTotal) {
      toast.error('Valor recebido é menor que o total da venda');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientTransactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const itemsWithDiscount = cart.map((item) => {
        const itemGross = item.quantity * item.unitPrice;
        const itemDiscount =
          grossTotal > 0 ? Math.round(((itemGross / grossTotal) * calculatedDiscount) * 100) / 100 : 0;
        return {
          productId: item.productId,
          quantity: item.quantity,
          discount: itemDiscount,
        };
      });

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTransactionId,
          customerNameSnapshot: customerName,
          customerCpfSnapshot: customerCpf || null,
          items: itemsWithDiscount,
          payments: [{ paymentMethod, amount: finalTotal }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao finalizar venda');
        return;
      }

      toast.success(`Venda #${data.sale.sequentialNumber} concluída com sucesso!`);

      setCompletedSale({
        ...data.sale,
        cartItems: [...cart],
        grossTotal,
        discountAmount: calculatedDiscount,
        receivedAmount: paymentMethod === 'BRINDE' ? finalTotal : receivedAmount,
        change,
        paymentMethod,
        dateFormatted: new Date().toLocaleString('pt-BR'),
      });

      setShowThermalModal(true);
      setActiveTab('RECEIPT');

      setCart([]);
      setReceivedAmount(0);
      setDiscountInputValue(0);
      setCustomerName('Cliente Consumidor');
      setCustomerCpf('');
      setPaymentMethod('DINHEIRO');
      setDiscountMode('FIXED');
      localStorage.removeItem('flavioCaixaState');
    } catch {
      toast.error('Erro de conexão ao finalizar a venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CÁLCULOS DO FECHAMENTO DE CAIXA
  const openingVal = Number(session?.openingAmount || 0);
  const cashSalesVal = Number(session?.totalsByPaymentMethod?.DINHEIRO || 0);

  // Suprimentos e Sangrias
  const suprimentosVal = Number(
    session?.movements
      ?.filter((m: any) => m.type === 'SUPRIMENTO')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0) || 0
  );
  const sangriasVal = Number(
    session?.movements
      ?.filter((m: any) => m.type === 'SANGRIA')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0) || 0
  );

  const expectedCashInDrawer = openingVal + cashSalesVal + suprimentosVal - sangriasVal;
  const cashDifference = informedCashAmount - expectedCashInDrawer;

  const handleOpenCloseModal = () => {
    setInformedCashAmount(expectedCashInDrawer);
    setShowCloseCashModal(true);
  };

  const handleConfirmCloseCash = async () => {
    setIsClosingCash(true);
    try {
      const res = await fetch(`/api/cash-sessions/${session.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          informedAmount: informedCashAmount,
          notes: closeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao fechar caixa');
        setIsClosingCash(false);
        return;
      }

      toast.success('Caixa fechado com sucesso!');

      const reportData = {
        session: data.cashSession,
        operatorName: session.operatorName || 'Operador do Caixa',
        openedAtFormatted: new Date(session.openedAt).toLocaleString('pt-BR'),
        closedAtFormatted: new Date().toLocaleString('pt-BR'),
        openingAmount: openingVal,
        totalSales: session.totalSales,
        salesCount: session.salesCount,
        totalsByPaymentMethod: session.totalsByPaymentMethod,
        suprimentos: suprimentosVal,
        sangrias: sangriasVal,
        expectedAmount: expectedCashInDrawer,
        informedAmount: informedCashAmount,
        difference: cashDifference,
      };

      setClosedCashReportData(reportData);
      setShowCloseCashModal(false);
      setShowClosedReceiptModal(true);
      
      // Clean up UI state
      setCart([]);
      setCustomerName('Cliente Consumidor');
      setCustomerCpf('');
      localStorage.removeItem('flavioCaixaState');
    } catch {
      toast.error('Erro de conexão ao fechar caixa');
    } finally {
      setIsClosingCash(false);
    }
  };

  const storeDisplayName = settings?.storeName || 'FLAVIO CELULARES';
  const storeAddress = settings?.address
    ? `${settings.address}${settings.number ? ', ' + settings.number : ''}${settings.city ? ' - ' + settings.city : ''}`
    : 'Rua das Flores, 123 - Centro';
  const storePhone = settings?.phone ? `Tel: ${settings.phone}` : 'Tel: (11) 99999-0000';
  const storeCnpj = settings?.cnpj ? `CNPJ: ${settings.cnpj}` : 'CNPJ: 00.000.000/0001-00';

  // GERADOR DE IMPRESSÃO DO RELATÓRIO DO FECHAMENTO DE CAIXA (80MM)
  const handlePrintClosureReport = () => {
    if (!closedCashReportData) return;
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const html = `
      <div class="thermal-ticket-80mm">
        <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px;">
          <img src="${window.location.origin}/images/logo-v6.png" style="max-width: 100px; height: auto; margin: 0 auto 5px auto; display: block;" />
          <p style="font-weight:bold; font-size:12px; margin:0; text-transform:uppercase;">${storeDisplayName}</p>
          <p style="font-size:9px; margin:2px 0;">${storeAddress}</p>
          <p style="font-size:9px; margin:2px 0;">${storePhone} | ${storeCnpj}</p>
        </div>

        <div style="text-align:center; border-top:1px dashed #000; border-bottom:1px solid #000; padding:4px 0; margin-top:3px;">
          <p style="font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin:0;">
            RELATÓRIO DE FECHAMENTO DE CAIXA
          </p>
          <p style="font-size:8px; margin:2px 0 0 0;">Operador: ${closedCashReportData.operatorName}</p>
        </div>

        <div style="font-size:9px; border-bottom:1px dashed #000; padding:4px 0;">
          <p style="margin:2px 0;"><strong>Abertura:</strong> ${closedCashReportData.openedAtFormatted}</p>
          <p style="margin:2px 0;"><strong>Fechamento:</strong> ${closedCashReportData.closedAtFormatted}</p>
        </div>

        <div style="font-size:9px; border-bottom:1px solid #000; padding:4px 0;">
          <p style="font-weight:bold; font-size:9px; text-transform:uppercase; border-bottom:1px dashed #000; padding-bottom:2px; margin:0 0 4px 0;">
            RESUMO DE VENDAS DA SESSÃO:
          </p>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Vendas Realizadas:</span>
            <span style="font-weight:bold;">${closedCashReportData.salesCount} vendas</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Total de Vendas (R$):</span>
            <span style="font-weight:bold;">${formatCurrency(closedCashReportData.totalSales)}</span>
          </div>
        </div>

        <div style="font-size:9px; border-bottom:1px solid #000; padding:4px 0;">
          <p style="font-weight:bold; font-size:9px; text-transform:uppercase; border-bottom:1px dashed #000; padding-bottom:2px; margin:0 0 4px 0;">
            TOTAL POR MEIO DE PAGAMENTO:
          </p>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Dinheiro:</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.DINHEIRO || 0)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>PIX:</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.PIX || 0)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Débito:</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.CARTAO_DEBITO || 0)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Crédito à Vista:</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.CARTAO_CREDITO || 0)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>Brinde (Cortesia):</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.BRINDE || 0)}</span>
          </div>
        </div>

        <div style="font-size:9px; padding:4px 0;">
          <p style="font-weight:bold; font-size:9px; text-transform:uppercase; border-bottom:1px dashed #000; padding-bottom:2px; margin:0 0 4px 0;">
            CONFERÊNCIA DA GAVETA (DINHEIRO):
          </p>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>(+) Valor Inicial (Troco):</span>
            <span>${formatCurrency(closedCashReportData.openingAmount)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>(+) Vendas em Dinheiro:</span>
            <span>${formatCurrency(closedCashReportData.totalsByPaymentMethod?.DINHEIRO || 0)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>(+) Suprimentos:</span>
            <span>${formatCurrency(closedCashReportData.suprimentos)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0;">
            <span>(-) Sangrias:</span>
            <span>${formatCurrency(closedCashReportData.sangrias)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0; font-weight:bold; border-top:1px dashed #000; padding-top:2px;">
            <span>(=) Dinheiro Esperado:</span>
            <span>${formatCurrency(closedCashReportData.expectedAmount)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:2px 0; font-weight:bold;">
            <span>(=) Dinheiro Informado:</span>
            <span>${formatCurrency(closedCashReportData.informedAmount)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin:3px 0; font-weight:bold; font-size:10px; border-top:1px solid #000; padding-top:2px;">
            <span>DIFERENÇA / QUEBRA:</span>
            <span>${formatCurrency(closedCashReportData.difference)}</span>
          </div>
        </div>

        <div style="margin-top:12px; border:1px dashed #000; padding:8px 6px; text-align:center;">
          <p style="font-weight:bold; font-size:8.5px; font-family:sans-serif; text-transform:uppercase; margin:0;">
            CARIMBO DA LOJA
          </p>
          <div style="height:25mm;"></div>
          <div style="text-align:center; font-size:8px; font-family:sans-serif; border-top:1px solid #000; padding-top:2px; margin-top:2px;">
            <span style="font-weight:bold;">${storeDisplayName} — Assinatura Operador</span>
          </div>
        </div>
      </div>
    `;

    printArea.innerHTML = html;
    window.print();
    setTimeout(() => {
      printArea.innerHTML = '';
    }, 1500);
  };

  // IMPRESSÃO DE COMPROVANTE DE VENDA & GARANTIA
  const handlePrintDocument = (docType: 'RECEIPT' | 'WARRANTY') => {
    if (!completedSale) return;
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    let html = '';

    if (docType === 'RECEIPT') {
      html = `
        <div class="thermal-ticket-80mm">
          <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px;">
            <img src="${window.location.origin}/images/logo-v6.png" style="max-width: 100px; height: auto; margin: 0 auto 5px auto; display: block;" />
            <p style="font-weight:bold; font-size:12px; margin:0; text-transform:uppercase;">${storeDisplayName}</p>
            <p style="font-size:9px; margin:2px 0;">${storeAddress}</p>
            <p style="font-size:9px; margin:2px 0;">${storePhone} | ${storeCnpj}</p>
          </div>

          <div style="font-size:9px; border-bottom:1px dashed #000; padding:4px 0;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
              <span>CUPOM DE VENDA</span>
              <span>#${completedSale.sequentialNumber}</span>
            </div>
            <p style="margin:2px 0;">Data: ${completedSale.dateFormatted}</p>
            <p style="margin:2px 0;">Cliente: ${completedSale.customerNameSnapshot}</p>
            ${completedSale.customerCpfSnapshot ? `<p style="margin:2px 0;">CPF: ${completedSale.customerCpfSnapshot}</p>` : ''}
          </div>

          <div style="border-bottom:1px dashed #000; padding:4px 0;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:9px; border-bottom:1px solid #000; padding-bottom:2px;">
              <span>Item / Qtd x Valor</span>
              <span>Total</span>
            </div>
            ${completedSale.cartItems
              .map(
                (item: CartItem) => `
              <div style="font-size:9px; margin-top:3px;">
                <p style="font-weight:bold; margin:0;">[${item.code}] ${item.name}</p>
                <div style="display:flex; justify-content:space-between; font-size:8px;">
                  <span>${item.quantity} un x ${formatCurrency(item.unitPrice)}</span>
                  <span style="font-weight:bold;">${formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div style="font-size:9px; padding-top:4px;">
            <div style="display:flex; justify-content:space-between; margin-top:2px;">
              <span>Subtotal:</span>
              <span>${formatCurrency(completedSale.grossTotal || completedSale.totalAmount)}</span>
            </div>

            ${
              completedSale.discountAmount > 0
                ? `
              <div style="display:flex; justify-content:space-between; margin-top:2px; font-weight:bold;">
                <span>DESCONTO:</span>
                <span>- ${formatCurrency(completedSale.discountAmount)}</span>
              </div>
            `
                : ''
            }

            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:11px; border-top:1px solid #000; padding-top:2px; margin-top:3px;">
              <span>TOTAL PAGO:</span>
              <span>${formatCurrency(completedSale.totalAmount)}</span>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:2px;">
              <span>Forma de Pagamento:</span>
              <span style="font-weight:bold; text-transform:uppercase;">${formatPaymentMethod(completedSale.paymentMethod)}</span>
            </div>

            ${
              completedSale.paymentMethod === 'DINHEIRO' && completedSale.receivedAmount > 0
                ? `
              <div style="display:flex; justify-content:space-between; margin-top:2px;">
                <span>Valor Recebido:</span>
                <span>${formatCurrency(completedSale.receivedAmount)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:2px; font-weight:bold;">
                <span>Troco:</span>
                <span>${formatCurrency(completedSale.change)}</span>
              </div>
            `
                : ''
            }
          </div>

          <div style="text-align:center; font-size:8px; font-weight:bold; margin-top:8px; border-top:1px dashed #000; padding-top:4px;">
            Obrigado pela preferência!
          </div>
        </div>
      `;
    } else {
      html = `
        <div class="thermal-ticket-80mm">
          <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px;">
            <img src="${window.location.origin}/images/logo.png" style="max-width: 100px; height: auto; margin: 0 auto 5px auto; filter: grayscale(100%); display: block;" />
            <p style="font-weight:bold; font-size:12px; margin:0; text-transform:uppercase;">${storeDisplayName}</p>
            <p style="font-size:9px; margin:2px 0;">${storeAddress}</p>
            <p style="font-size:9px; margin:2px 0;">${storePhone} | ${storeCnpj}</p>
          </div>

          <div style="text-align:center; border-top:1px dashed #000; border-bottom:1px solid #000; padding:4px 0; margin-top:3px;">
            <p style="font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin:0;">
              TERMO DE GARANTIA
            </p>
            <p style="font-size:8px; margin:2px 0 0 0;">Venda #${completedSale.sequentialNumber} — Data: ${completedSale.dateFormatted}</p>
          </div>

          <div style="font-size:9px; border-bottom:1px dashed #000; padding:4px 0;">
            <p style="margin:2px 0;"><strong>Cliente:</strong> ${completedSale.customerNameSnapshot}</p>
            ${completedSale.customerCpfSnapshot ? `<p style="margin:2px 0;"><strong>CPF:</strong> ${completedSale.customerCpfSnapshot}</p>` : ''}
          </div>

          <div style="border-bottom:1px solid #000; padding:4px 0;">
            <p style="font-weight:bold; font-size:9px; text-transform:uppercase; border-bottom:1px dashed #000; padding-bottom:2px; margin:0 0 4px 0;">
              ITENS E TEMPOS DE GARANTIA:
            </p>
            ${completedSale.cartItems
              .map(
                (item: CartItem) => `
              <div style="font-size:8.5px; margin-bottom:4px; border-bottom:1px solid #eee; padding-bottom:2px;">
                <p style="font-weight:bold; margin:0;">[${item.code}] ${item.name}</p>
                <p style="font-weight:bold; color:#000; margin:1px 0 0 0;">
                  GARANTIA: ${item.warrantyMonths || 3} MESES (${Number(item.warrantyMonths || 3) * 30} DIAS)
                </p>
              </div>
            `
              )
              .join('')}
          </div>

          <div style="font-size:8px; font-family:sans-serif; padding:6px 0; line-height:1.3; text-align:justify;">
            <p style="font-weight:bold; text-align:center; margin:0 0 4px 0; text-transform:uppercase; border-bottom:1px dashed #000; padding-bottom:2px;">
              CONDIÇÕES DE GARANTIA E CUIDADOS:
            </p>
            <p style="margin:3px 0;">1. A garantia legal cobre defeitos de fabricação pelo prazo de 90 dias (ou conforme especificado na nota fiscal).</p>
            <p style="margin:3px 0;">2. <strong>CUIDADOS ESSENCIAIS:</strong> Evite quedas, umidade excessiva, exposição direta ao sol e contato com líquidos.</p>
            <p style="margin:3px 0;">3. <strong>LIMPEZA:</strong> Utilize apenas pano seco e macio. Não use produtos químicos ou álcool em excesso para não danificar a pintura/display.</p>
            <p style="margin:3px 0;">4. <strong>INSTALAÇÃO:</strong> Caso seja um produto eletrônico, utilize apenas a voltagem e os carregadores originais recomendados pelo fabricante.</p>
            <p style="margin:3px 0;">5. A perda da presente via invalida a garantia para peças e mão de obra.</p>
            <p style="margin:3px 0;">6. O cliente deverá apresentar este comprovante juntamente com o produto para atendimento na assistência técnica.</p>
          </div>

          <div style="margin-top:8px; border:1px dashed #000; padding:8px 6px; text-align:center; min-height:48mm; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            <p style="font-weight:bold; font-size:8.5px; font-family:sans-serif; text-transform:uppercase; margin:0;">
              CARIMBO DA LOJA
            </p>
            <div style="height:32mm;"></div>
            <div style="text-align:center; font-size:8px; font-family:sans-serif; border-top:1px solid #000; padding-top:2px; margin-top:2px;">
              <span style="font-weight:bold;">${storeDisplayName} — Carimbo / Vendedor</span>
            </div>
          </div>
        </div>
      `;
    }

    printArea.innerHTML = html;
    window.print();
    setTimeout(() => {
      printArea.innerHTML = '';
    }, 1500);
  };

  if (isLoadingSession) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md card p-6 text-center space-y-4">
        <ShoppingCart className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Nenhum Caixa Aberto</h2>
        <p className="text-sm text-slate-400">
          Você precisa abrir o seu caixa com um valor inicial de troco para realizar vendas.
        </p>
        <div className="space-y-2 text-left">
          <label className="label">Valor Inicial (Suprimento)</label>
          <input
            type="number"
            step="0.01"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(Number(e.target.value))}
            className="input"
            placeholder="0.00"
          />
        </div>
        <button onClick={handleOpenCash} className="btn-primary w-full py-3">
          Abrir Caixa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* BOTÃO DE FECHAMENTO DE CAIXA NO HEADER DA PÁGINA */}
      <div className="flex items-center justify-between card px-4 py-3 bg-slate-900 border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            Caixa Aberto (Sessão #{session.id.slice(-5)}) — Troco Inicial: {formatCurrency(session.openingAmount)}
          </span>
        </div>

        <button
          onClick={handleOpenCloseModal}
          className="btn-secondary btn-sm text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5 font-bold"
        >
          <Lock className="h-3.5 w-3.5" />
          Fechar Caixa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Esquerda: Leitor e Produtos */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="card p-4 space-y-3">
            <label className="label text-xs uppercase tracking-wider text-slate-400 font-bold">
              Código do Produto / Leitor de Código de Barras (Enter)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProduct(e.target.value);
                }}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Digite o código (ex: 0287) ou passe o scanner..."
                className="input pl-10 text-lg font-mono py-3"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-20 w-full max-w-lg mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                {searchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="flex items-center justify-between p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 text-sm"
                  >
                    <div>
                      <span className="font-bold text-blue-400 font-mono">[{prod.code}]</span> {prod.name}
                      <p className="text-xs text-slate-400">Estoque Disp: {prod.stockAvailable} | Garantia: {prod.warrantyMonths || 3} meses</p>
                    </div>
                    <span className="font-bold text-emerald-400">{formatCurrency(prod.salePrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="card flex-1 p-4 flex flex-col overflow-hidden">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              Carrinho de Compras ({cart.length} itens)
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-500">
                  <ShoppingCart className="h-12 w-12 mb-2 opacity-30" />
                  <p>Carrinho vazio. Adicione produtos acima.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-200 text-sm truncate">
                        <span className="font-mono text-blue-400">[{item.code}]</span> {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.quantity} x {formatCurrency(item.unitPrice)} | <span className="text-amber-400 font-medium">Garantia: {item.warrantyMonths} meses</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-400">{formatCurrency(item.subtotal)}</span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Direita: Desconto Livre, Formas de Pagamento e Totais */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input text-xs"
                placeholder="Nome do cliente"
              />
              <input
                type="text"
                value={customerCpf}
                onChange={(e) => setCustomerCpf(e.target.value)}
                className="input text-xs"
                placeholder="CPF (opcional)"
              />
            </div>
          </div>

          {/* DESCONTO LIVRE */}
          <div className="card p-4 space-y-3 bg-slate-900 border-amber-500/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="h-4 w-4" /> Desconto Livre da Venda
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleApply100PercentOff}
                  className="btn-secondary btn-sm text-[10px] px-2 py-0.5 text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-bold"
                >
                  100% OFF (Zerar)
                </button>
                <button
                  type="button"
                  onClick={handleClearDiscount}
                  className="btn-ghost btn-sm text-[10px] px-2 py-0.5 text-slate-400 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" /> Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-4 flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDiscountMode('FIXED')}
                  className={`flex-1 py-1 text-xs font-bold rounded ${
                    discountMode === 'FIXED' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  R$ Fixos
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('PERCENT')}
                  className={`flex-1 py-1 text-xs font-bold rounded ${
                    discountMode === 'PERCENT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  % Porcent.
                </button>
              </div>

              <div className="sm:col-span-8 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountInputValue}
                  onChange={(e) => setDiscountInputValue(Number(e.target.value))}
                  className="input text-sm font-bold text-amber-400 pl-8"
                  placeholder={discountMode === 'PERCENT' ? '0%' : '0,00'}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                  {discountMode === 'PERCENT' ? '%' : 'R$'}
                </span>
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <p className="text-[11px] text-amber-400 font-medium text-right">
                Valor descontado: - {formatCurrency(calculatedDiscount)}
              </p>
            )}
          </div>

          {/* FORMAS DE PAGAMENTO */}
          <div className="card p-4 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Forma de Pagamento
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'DINHEIRO', label: 'Dinheiro' },
                  { id: 'PIX', label: 'PIX' },
                  { id: 'CARTAO_DEBITO', label: 'Débito' },
                  { id: 'CARTAO_CREDITO', label: 'Crédito à Vista' },
                  { id: 'BRINDE', label: '🎁 BRINDE' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(m.id)}
                    className={`btn py-2.5 text-xs font-bold ${
                      paymentMethod === m.id
                        ? m.id === 'BRINDE'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                          : 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'DINHEIRO' && (
                <div className="space-y-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <label className="label text-xs">Valor Recebido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    className="input text-lg font-bold text-emerald-400"
                    placeholder="0.00"
                  />
                  {receivedAmount > 0 && (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-slate-400">Troco:</span>
                      <span className="font-bold text-amber-400">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'BRINDE' && (
                <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800 text-xs text-purple-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-purple-400" /> Item Cedido como Brinde
                  </p>
                  <p className="text-[11px] text-purple-400">
                    O valor desta venda (R$ {formatCurrency(finalTotal)}) será coberto como Brinde cortesia com R$ 0,00 de troco.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal Bruto:</span>
                  <span>{formatCurrency(grossTotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-amber-400 font-bold">
                    <span>Desconto Aplicado:</span>
                    <span>- {formatCurrency(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-slate-800">
                  <span>TOTAL:</span>
                  <span className="text-emerald-400">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleFinalizeSale}
                disabled={isSubmitting || cart.length === 0}
                className="btn-primary w-full py-4 text-base font-bold tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Finalizando Venda...
                  </>
                ) : (
                  'FINALIZAR VENDA'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CONFIRMAÇÃO DE FECHAMENTO DE CAIXA */}
      {showCloseCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 no-print">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-4 p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <Lock className="h-5 w-5" />
                Fechamento de Caixa
              </div>
              <button
                onClick={() => setShowCloseCashModal(false)}
                className="btn-ghost p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Vendas da Sessão:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(session.totalSales)} ({session.salesCount} vendas)</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-1.5">
                  <span className="text-slate-400">Troco Inicial (Abertura):</span>
                  <span>{formatCurrency(openingVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendas em Dinheiro:</span>
                  <span>{formatCurrency(cashSalesVal)}</span>
                </div>
                <div className="flex justify-between font-bold text-cyan-400 border-t border-slate-700 pt-1.5 text-sm">
                  <span>Dinheiro Esperado na Gaveta:</span>
                  <span>{formatCurrency(expectedCashInDrawer)}</span>
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-slate-200">
                  Informe o Valor em Dinheiro Contado na Gaveta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={informedCashAmount}
                  onChange={(e) => setInformedCashAmount(Number(e.target.value))}
                  className="input text-lg font-bold text-emerald-400 mt-1"
                  placeholder="0.00"
                />
              </div>

              {cashDifference !== 0 && (
                <div
                  className={`p-2.5 rounded-lg border text-xs font-bold flex justify-between items-center ${
                    cashDifference > 0
                      ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  <span>{cashDifference > 0 ? 'Sobra de Caixa:' : 'Diferença / Quebra de Caixa:'}</span>
                  <span>{formatCurrency(cashDifference)}</span>
                </div>
              )}

              <div>
                <label className="label text-xs">Observações do Fechamento (Opcional)</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="input text-xs mt-1"
                  placeholder="Ex: Tudo conferido e bateu com a gaveta."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloseCashModal(false)}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseCash}
                disabled={isClosingCash}
                className="btn-primary flex-1 py-3 text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2"
              >
                {isClosingCash ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Confirmar Fechamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RELATÓRIO DO FECHAMENTO DE CAIXA + BOTOES DE IMPRESSÃO TÉRMICA */}
      {showClosedReceiptModal && closedCashReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 no-print">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-4 p-5 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle className="h-5 w-5" />
                Caixa Fechado com Sucesso!
              </div>
              <button
                onClick={() => {
                  setShowClosedReceiptModal(false);
                  loadData();
                }}
                className="btn-ghost p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handlePrintClosureReport}
              className="btn-primary w-full py-4 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              <Printer className="h-5 w-5" />
              IMPRIMIR RELATÓRIO DE FECHAMENTO (80MM)
            </button>

            {/* Pré-Visualização na Tela do Relatório de Fechamento */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="bg-white text-black p-4 rounded border border-slate-300 font-mono text-xs space-y-2 select-text shadow-inner">
                <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                  <p className="font-bold text-sm tracking-wider uppercase">{storeDisplayName}</p>
                  <p className="text-[10px]">{storeAddress}</p>
                  <p className="text-[9px]">{storePhone}</p>
                  <p className="text-[9px]">{storeCnpj}</p>
                </div>

                <div className="text-center border-t border-b border-black py-1 my-1">
                  <p className="font-bold text-xs uppercase tracking-widest">
                    RELATÓRIO DE FECHAMENTO DE CAIXA
                  </p>
                  <p className="text-[9px]">Operador: {closedCashReportData.operatorName}</p>
                </div>

                <div className="text-[9px] border-b border-dashed border-black pb-1.5 space-y-0.5">
                  <p><strong>Abertura:</strong> {closedCashReportData.openedAtFormatted}</p>
                  <p><strong>Fechamento:</strong> {closedCashReportData.closedAtFormatted}</p>
                </div>

                <div className="text-[9px] border-b border-black py-1.5 space-y-0.5">
                  <p className="font-bold uppercase border-b border-dashed border-black pb-0.5">
                    RESUMO DE VENDAS DA SESSÃO:
                  </p>
                  <div className="flex justify-between">
                    <span>Vendas Realizadas:</span>
                    <span className="font-bold">{closedCashReportData.salesCount} vendas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Vendas:</span>
                    <span className="font-bold">{formatCurrency(closedCashReportData.totalSales)}</span>
                  </div>
                </div>

                <div className="text-[9px] border-b border-black py-1.5 space-y-0.5">
                  <p className="font-bold uppercase border-b border-dashed border-black pb-0.5">
                    TOTAL POR MEIO DE PAGAMENTO:
                  </p>
                  <div className="flex justify-between">
                    <span>Dinheiro:</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.DINHEIRO || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PIX:</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.PIX || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Débito:</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.CARTAO_DEBITO || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédito à Vista:</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.CARTAO_CREDITO || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brinde (Cortesia):</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.BRINDE || 0)}</span>
                  </div>
                </div>

                <div className="text-[9px] py-1.5 space-y-1">
                  <p className="font-bold uppercase border-b border-dashed border-black pb-0.5">
                    CONFERÊNCIA DA GAVETA (DINHEIRO):
                  </p>
                  <div className="flex justify-between">
                    <span>(+) Troco Inicial:</span>
                    <span>{formatCurrency(closedCashReportData.openingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(+) Vendas em Dinheiro:</span>
                    <span>{formatCurrency(closedCashReportData.totalsByPaymentMethod?.DINHEIRO || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-black pt-1">
                    <span>(=) Dinheiro Esperado:</span>
                    <span>{formatCurrency(closedCashReportData.expectedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>(=) Dinheiro Informado:</span>
                    <span>{formatCurrency(closedCashReportData.informedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs border-t border-black pt-1">
                    <span>DIFERENÇA / QUEBRA:</span>
                    <span>{formatCurrency(closedCashReportData.difference)}</span>
                  </div>
                </div>

                <div className="mt-3 border border-dashed border-black p-3 text-center min-h-[100px] flex flex-col justify-between font-sans">
                  <p className="font-bold text-[9px] uppercase tracking-wider">
                    CARIMBO DA LOJA
                  </p>
                  <div className="h-12" />
                  <div className="text-center text-[8px] border-t border-black pt-1">
                    <span className="font-bold">{storeDisplayName} — Assinatura Operador</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setShowClosedReceiptModal(false);
                  loadData();
                }}
                className="btn-secondary w-full py-2.5 text-xs text-slate-300"
              >
                Concluir e Voltar ao Início
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL IMPRESSÃO TÉRMICA COMPROVANTE DE VENDA & TERMO DE GARANTIA */}
      {showThermalModal && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 no-print">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-4 p-5 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle className="h-5 w-5" />
                Venda #{completedSale.sequentialNumber} Concluída!
              </div>
              <button
                onClick={() => setShowThermalModal(false)}
                className="btn-ghost p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex rounded-lg bg-slate-800 p-1 shrink-0">
              <button
                onClick={() => setActiveTab('RECEIPT')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'RECEIPT'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="h-4 w-4" />
                1. Comprovante de Venda (80mm)
              </button>
              <button
                onClick={() => setActiveTab('WARRANTY')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'WARRANTY'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                2. Termo de Garantia (80mm)
              </button>
            </div>

            <div className="shrink-0">
              {activeTab === 'RECEIPT' ? (
                <button
                  onClick={() => handlePrintDocument('RECEIPT')}
                  className="btn-primary w-full py-3.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Printer className="h-5 w-5" />
                  IMPRIMIR COMPROVANTE DE VENDA (80MM)
                </button>
              ) : (
                <button
                  onClick={() => handlePrintDocument('WARRANTY')}
                  className="btn-primary w-full py-3.5 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                >
                  <FileText className="h-5 w-5" />
                  IMPRIMIR TERMO DE GARANTIA (80MM)
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === 'RECEIPT' ? (
                <div className="bg-white text-black p-4 rounded border border-slate-300 font-mono text-xs space-y-2 select-text shadow-inner">
                  <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                    <p className="font-bold text-sm tracking-wider uppercase">{storeDisplayName}</p>
                    <p className="text-[10px]">{storeAddress}</p>
                    <p className="text-[9px]">{storePhone}</p>
                    <p className="text-[9px]">{storeCnpj}</p>
                  </div>

                  <div className="text-[10px] space-y-0.5 border-b border-dashed border-black py-1.5">
                    <div className="flex justify-between font-bold">
                      <span>CUPOM DE VENDA</span>
                      <span>#{completedSale.sequentialNumber}</span>
                    </div>
                    <p>Data: {completedSale.dateFormatted}</p>
                    <p>Cliente: {completedSale.customerNameSnapshot}</p>
                    {completedSale.customerCpfSnapshot && <p>CPF: {completedSale.customerCpfSnapshot}</p>}
                  </div>

                  <div className="border-b border-dashed border-black py-1.5 space-y-1">
                    <div className="flex justify-between font-bold text-[9px] uppercase border-b border-black pb-0.5">
                      <span>Item / Qtd x Valor</span>
                      <span>Total</span>
                    </div>
                    {completedSale.cartItems.map((item: CartItem) => (
                      <div key={item.productId} className="text-[10px] space-y-0.5">
                        <p className="font-bold leading-tight">[{item.code}] {item.name}</p>
                        <div className="flex justify-between text-[9px] text-slate-800">
                          <span>{item.quantity} un x {formatCurrency(item.unitPrice)}</span>
                          <span className="font-bold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] space-y-1 pt-1.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(completedSale.grossTotal || completedSale.totalAmount)}</span>
                    </div>

                    {completedSale.discountAmount > 0 && (
                      <div className="flex justify-between font-bold text-black">
                        <span>DESCONTO:</span>
                        <span>- {formatCurrency(completedSale.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                      <span>TOTAL PAGO:</span>
                      <span>{formatCurrency(completedSale.totalAmount)}</span>
                    </div>

                    <div className="flex justify-between text-[9px]">
                      <span>Forma de Pagamento:</span>
                      <span className="font-bold">{formatPaymentMethod(completedSale.paymentMethod)}</span>
                    </div>

                    {completedSale.paymentMethod === 'DINHEIRO' && completedSale.receivedAmount > 0 && (
                      <>
                        <div className="flex justify-between text-[9px]">
                          <span>Valor Recebido:</span>
                          <span>{formatCurrency(completedSale.receivedAmount)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold">
                          <span>Troco:</span>
                          <span>{formatCurrency(completedSale.change)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-[8px] text-center pt-2 border-t border-dashed border-black">
                    <p className="font-bold">Obrigado pela preferência!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white text-black p-4 rounded border border-slate-300 font-mono text-xs space-y-2 select-text shadow-inner">
                  <div className="text-center space-y-0.5 border-b border-black pb-2">
                    <p className="font-bold text-sm tracking-wider uppercase">{storeDisplayName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest border-t border-b border-black py-1 my-1 text-center">
                      TERMO DE GARANTIA
                    </p>
                    <p className="text-[9px]">Venda #{completedSale.sequentialNumber} — Data: {completedSale.dateFormatted}</p>
                  </div>

                  <div className="text-[9px] space-y-0.5 border-b border-dashed border-black pb-1.5">
                    <p><strong>Cliente:</strong> {completedSale.customerNameSnapshot}</p>
                    {completedSale.customerCpfSnapshot && <p><strong>CPF:</strong> {completedSale.customerCpfSnapshot}</p>}
                  </div>

                  <div className="border-b border-black py-1.5 space-y-1.5">
                    <p className="font-bold text-[9px] uppercase border-b border-dashed border-black pb-0.5">
                      ITENS E TEMPOS DE GARANTIA:
                    </p>
                    {completedSale.cartItems.map((item: CartItem) => (
                      <div key={item.productId} className="text-[9px] bg-slate-100 p-1 border border-slate-300 rounded">
                        <p className="font-bold">[{item.code}] {item.name}</p>
                        <p className="text-blue-900 font-bold mt-0.5">
                          PRAZO DE GARANTIA: {item.warrantyMonths || 3} MESES ({Number(item.warrantyMonths || 3) * 30} DIAS)
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="text-[8px] space-y-1 py-1.5 font-sans leading-relaxed text-justify">
                    <p className="font-bold text-center uppercase border-b border-slate-400 pb-1">CONDIÇÕES DE GARANTIA E CUIDADOS:</p>
                    <p>1. A garantia legal cobre defeitos de fabricação pelo prazo de 90 dias (ou conforme especificado na nota fiscal).</p>
                    <p>2. <strong>CUIDADOS ESSENCIAIS:</strong> Evite quedas, umidade excessiva, exposição direta ao sol e contato com líquidos.</p>
                    <p>3. <strong>LIMPEZA:</strong> Utilize apenas pano seco e macio. Não use produtos químicos ou álcool em excesso para não danificar a pintura/display.</p>
                    <p>4. <strong>INSTALAÇÃO:</strong> Caso seja um produto eletrônico, utilize apenas a voltagem e os carregadores originais recomendados pelo fabricante.</p>
                    <p>5. A perda da presente via invalida a garantia para peças e mão de obra.</p>
                    <p>6. O cliente deverá apresentar este comprovante juntamente com o produto para atendimento na assistência técnica.</p>
                  </div>

                  <div className="mt-3 border border-dashed border-black p-3 text-center min-h-[140px] flex flex-col justify-between font-sans">
                    <p className="font-bold text-[9px] uppercase tracking-wider">
                      CARIMBO DA LOJA
                    </p>

                    <div className="h-20" />

                    <div className="text-center text-[8px] border-t border-black pt-1">
                      <span className="font-bold">{storeDisplayName} — Carimbo / Vendedor</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setShowThermalModal(false)}
                className="btn-secondary w-full py-2.5 text-xs text-slate-300"
              >
                Concluir e Voltar ao Caixa
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
