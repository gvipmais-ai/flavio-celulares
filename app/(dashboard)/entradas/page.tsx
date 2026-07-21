'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Truck,
  CheckCircle,
  Plus,
  X,
  Trash2,
  Loader2,
  Search,
  PlusCircle,
  Package,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';

interface EntryItemInput {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export default function EntradasPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Principal: Entrada de Nota
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State para Nota Fiscal
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<EntryItemInput[]>([]);

  // Busca Inteligente por Nome/Código
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  // Modal Secundário: Cadastro Rápido de Mercadoria
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [quickProduct, setQuickProduct] = useState({
    code: '0' + Math.floor(1000 + Math.random() * 9000),
    name: '',
    categoryId: '',
    brandId: '',
    costPrice: 0,
    salePrice: 0,
    warrantyMonths: 3,
    minimumStock: 3,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resEntries, resSuppliers, resCat, resBrand] = await Promise.all([
        fetch('/api/purchase-entries'),
        fetch('/api/suppliers'),
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);

      const dataEntries = await resEntries.json();
      const dataSuppliers = await resSuppliers.json();
      const dataCat = await resCat.json();
      const dataBrand = await resBrand.json();

      setEntries(dataEntries.data || []);
      setSuppliers(dataSuppliers.data || []);
      setCategories(dataCat.data || []);
      setBrands(dataBrand.data || []);

      if (dataSuppliers.data?.[0]) setSupplierId(dataSuppliers.data[0].id);
      if (dataCat.data?.[0]) {
        setQuickProduct((prev) => ({
          ...prev,
          categoryId: dataCat.data[0].id,
          brandId: dataBrand.data?.[0]?.id || '',
        }));
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Busca instantânea de produtos por nome ou código
  const handleSearchProducts = async (query: string) => {
    setProductQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}&pageSize=6`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch {
      // silent
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setItemCost(Number(product.costPrice || 0));
    setProductQuery(`[${product.code}] ${product.name}`);
    setSearchResults([]);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Procure e selecione um produto por nome ou código');
      return;
    }
    if (itemQty <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const subtotal = itemQty * itemCost;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProduct.id
            ? { ...i, quantity: i.quantity + itemQty, unitCost: itemCost, subtotal: (i.quantity + itemQty) * itemCost }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          code: selectedProduct.code,
          name: selectedProduct.name,
          quantity: itemQty,
          unitCost: itemCost,
          subtotal,
        },
      ];
    });

    setSelectedProduct(null);
    setProductQuery('');
    setItemQty(1);
    setItemCost(0);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleRemoveItem = (prodId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== prodId));
  };

  const totalInvoice = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Cadastro Rápido de Novo Produto direto da tela de Nota
  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProduct.name.trim()) {
      toast.error('Informe o nome da mercadoria');
      return;
    }

    setIsSavingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quickProduct,
          productType: 'ACESSORIO',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || data.message || 'Erro ao cadastrar produto rápido');
        return;
      }

      const createdProduct = data.product || data;

      toast.success(`Mercadoria "${createdProduct.name}" cadastrada com sucesso!`);

      // Selecionar automaticamente o produto novo no formulário de entrada
      handleSelectProduct(createdProduct);

      // Resetar form do cadastro rápido
      setQuickProduct({
        code: '0' + Math.floor(1000 + Math.random() * 9000),
        name: '',
        categoryId: categories[0]?.id || '',
        brandId: brands[0]?.id || '',
        costPrice: 0,
        salePrice: 0,
        warrantyMonths: 3,
        minimumStock: 3,
      });

      setShowQuickAddModal(false);
    } catch {
      toast.error('Erro de conexão ao cadastrar mercadoria');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveEntry = async (autoConfirm: boolean) => {
    if (!supplierId) {
      toast.error('Selecione o fornecedor');
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error('Informe o número da nota fiscal');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um produto na nota');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();

      const res = await fetch('/api/purchase-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          invoiceNumber: invoiceNumber.trim(),
          issueDate: nowIso,
          entryDate: nowIso,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            discount: 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar nota de entrada');
        setIsSubmitting(false);
        return;
      }

      const createdEntryId = data.entry.id;

      if (autoConfirm) {
        const resConfirm = await fetch(`/api/purchase-entries/${createdEntryId}/confirm`, {
          method: 'POST',
        });
        const dataConfirm = await resConfirm.json();
        if (!resConfirm.ok) {
          toast.error(dataConfirm.error?.message || 'Nota criada mas erro ao confirmar estoque');
          loadData();
          setShowModal(false);
          setIsSubmitting(false);
          return;
        }
        toast.success(`Nota Fiscal NF #${invoiceNumber} confirmada e estoque atualizado!`);
      } else {
        toast.success(`Nota Fiscal NF #${invoiceNumber} criada em Rascunho!`);
      }

      setInvoiceNumber('');
      setItems([]);
      setShowModal(false);
      loadData();
    } catch {
      toast.error('Erro de conexão ao salvar nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingle = async (id: string) => {
    if (!confirm('Deseja confirmar esta nota de entrada? O estoque dos produtos será atualizado.')) return;
    try {
      const res = await fetch(`/api/purchase-entries/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao confirmar nota');
        return;
      }
      toast.success('Nota de entrada confirmada e estoque atualizado!');
      loadData();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-400" />
            Notas de Entrada de Mercadorias
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie e dê entrada de novas compras de produtos no estoque
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
        >
          <Plus className="h-4 w-4" /> Dar Entrada em Nova Nota
        </button>
      </div>

      {/* Tabela de Notas Fiscais */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nº Nota Fiscal</th>
                <th>Fornecedor</th>
                <th>Data Emissão</th>
                <th>Total Nota</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Carregando notas...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 space-y-2">
                    <Truck className="h-10 w-10 mx-auto opacity-30 text-cyan-400" />
                    <p className="font-semibold text-slate-300">Nenhuma nota de entrada registrada</p>
                    <p className="text-xs">Clique no botão "+ Dar Entrada em Nova Nota" acima para cadastrar.</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-mono font-bold text-cyan-400">
                      NF #{entry.invoiceNumber}
                    </td>
                    <td className="font-medium text-slate-200">{entry.supplier?.name}</td>
                    <td>{formatDateTime(entry.issueDate)}</td>
                    <td className="font-bold text-emerald-400">{formatCurrency(entry.totalAmount)}</td>
                    <td>
                      <span
                        className={`badge ${
                          entry.status === 'CONFIRMADA'
                            ? 'badge-success'
                            : entry.status === 'RASCUNHO'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      {entry.status === 'RASCUNHO' && (
                        <button
                          onClick={() => handleConfirmSingle(entry.id)}
                          className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-500"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Confirmar Estoque
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PRINCIPAL: DAR ENTRADA EM NOVA NOTA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Truck className="h-5 w-5 text-cyan-400" />
                Dar Entrada em Nova Nota Fiscal de Compra
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Fornecedor e Nº Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Fornecedor</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="input mt-1"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Nº da Nota Fiscal (NF-e / Recibo)</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="input mt-1 font-mono"
                    placeholder="Ex: 10492"
                  />
                </div>
              </div>

              {/* BARRA DE PESQUISA INTUITIVA DE PRODUTOS + BOTÃO CADASTRO RÁPIDO */}
              <div className="card p-4 space-y-3 bg-slate-800/40 border-slate-700/60 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Buscar Produto para Entrada
                  </h3>
                  {/* BOTÃO CADASTRO RÁPIDO DE MERCADORIA */}
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(true)}
                    className="btn-secondary btn-sm text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10 flex items-center gap-1.5"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    + Cadastrar Nova Mercadoria (Rápido)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  
                  {/* Busca por Nome / Código */}
                  <div className="sm:col-span-6 relative">
                    <label className="label text-xs">Pesquisar Mercadoria (Nome ou Código)</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={productQuery}
                        onChange={(e) => handleSearchProducts(e.target.value)}
                        placeholder="Digite o nome ou código (ex: Capa, 0287)..."
                        className="input pl-9 text-xs font-medium"
                      />
                    </div>

                    {/* Autocomplete de Resultados */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-30 w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl max-h-48 overflow-y-auto">
                        {searchResults.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleSelectProduct(prod)}
                            className="p-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800 text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold font-mono text-cyan-400">[{prod.code}]</span> {prod.name}
                              <p className="text-[10px] text-slate-400">Estoque Atual: {prod.stockOnHand}</p>
                            </div>
                            <span className="font-bold text-emerald-400">R$ {Number(prod.costPrice).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label text-xs">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="input text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label text-xs">Custo Un (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      className="input text-xs font-bold text-emerald-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn-primary w-full text-xs py-2 bg-cyan-600 hover:bg-cyan-500"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Itens Adicionados */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mercadorias na Nota ({items.length} itens)
                </h3>

                {items.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded">
                    Nenhuma mercadoria adicionada. Digite o nome acima ou clique em "+ Cadastrar Nova Mercadoria".
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-200">
                            <span className="font-mono text-cyan-400">[{item.code}]</span> {item.name}
                          </p>
                          <p className="text-slate-400">
                            {item.quantity} un x {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400">{formatCurrency(item.subtotal)}</span>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="btn-ghost p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total da Nota */}
              {items.length > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm font-bold">
                  <span className="text-slate-300">TOTAL DA NOTA:</span>
                  <span className="text-lg text-emerald-400">{formatCurrency(totalInvoice)}</span>
                </div>
              )}

            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveEntry(false)}
                disabled={isSubmitting || items.length === 0}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                Salvar como Rascunho
              </button>
              <button
                type="button"
                onClick={() => handleSaveEntry(true)}
                disabled={isSubmitting || items.length === 0}
                className="btn-primary flex-1 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Salvar e Atualizar Estoque
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL SECUNDÁRIO: CADASTRO RÁPIDO DE MERCADORIA */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 no-print">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Package className="h-5 w-5 text-blue-400" />
                Cadastro Rápido de Mercadoria
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="btn-ghost p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Código do Produto</label>
                  <input
                    type="text"
                    value={quickProduct.code}
                    onChange={(e) => setQuickProduct({ ...quickProduct, code: e.target.value })}
                    className="input text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Garantia (Meses)</label>
                  <select
                    value={quickProduct.warrantyMonths}
                    onChange={(e) => setQuickProduct({ ...quickProduct, warrantyMonths: Number(e.target.value) })}
                    className="input text-xs"
                  >
                    <option value={1}>1 Mês (30 dias)</option>
                    <option value={3}>3 Meses (90 dias)</option>
                    <option value={6}>6 Meses</option>
                    <option value={12}>12 Meses (1 Ano)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs">Nome da Mercadoria / Produto</label>
                <input
                  type="text"
                  value={quickProduct.name}
                  onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                  placeholder="Ex: Capa Transparente iPhone 15"
                  className="input text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Categoria</label>
                  <select
                    value={quickProduct.categoryId}
                    onChange={(e) => setQuickProduct({ ...quickProduct, categoryId: e.target.value })}
                    className="input text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Marca</label>
                  <select
                    value={quickProduct.brandId}
                    onChange={(e) => setQuickProduct({ ...quickProduct, brandId: e.target.value })}
                    className="input text-xs"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickProduct.costPrice}
                    onChange={(e) => setQuickProduct({ ...quickProduct, costPrice: Number(e.target.value) })}
                    className="input text-xs font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickProduct.salePrice}
                    onChange={(e) => setQuickProduct({ ...quickProduct, salePrice: Number(e.target.value) })}
                    className="input text-xs font-bold text-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="btn-secondary flex-1 text-xs py-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="btn-primary flex-1 text-xs py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  {isSavingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar Mercadoria'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
