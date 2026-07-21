'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function EtiquetasPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(6);
  const [format, setFormat] = useState<'A4_SHEET' | 'THERMAL_50X30'>('A4_SHEET');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.data || []);
        if (data.data?.[0]) setSelectedProduct(data.data[0]);
      } catch {
        toast.error('Erro ao carregar produtos');
      }
    }
    loadProducts();
  }, []);

  const handlePrint = () => {
    if (!selectedProduct) return;
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const stickersHtml = Array.from({ length: quantity })
      .map(
        () => `
      <div class="${format === 'A4_SHEET' ? 'a4-label-card' : 'thermal-label-50x30'}">
        <div>
          <p style="font-size:8px; font-weight:900; text-transform:uppercase; margin:0; font-family:sans-serif;">FLAVIO CELULARES</p>
          <p style="font-size:10px; font-weight:bold; margin:2px 0; word-break:break-word; font-family:sans-serif; line-height:1.1;">${selectedProduct.name}</p>
        </div>
        <div>
          <p style="font-size:11px; font-weight:900; margin:2px 0; font-family:sans-serif;">R$ ${Number(selectedProduct.salePrice).toFixed(2)}</p>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="height:16px; width:100%; background:#000; display:flex; justify-content:center; align-items:center; gap:1px; padding:1px 0;">
              ${Array.from({ length: 22 })
                .map(
                  (_, idx) =>
                    `<div style="height:100%; width:${idx % 3 === 0 ? '2px' : '1px'}; background:${idx % 2 === 0 ? '#ffffff' : '#000000'};"></div>`
                )
                .join('')}
            </div>
            <span style="font-size:8px; font-family:monospace; font-weight:bold; margin-top:1px;">*${selectedProduct.code}*</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    printArea.innerHTML = `<div class="${format === 'A4_SHEET' ? 'a4-sheet-grid' : ''}">${stickersHtml}</div>`;
    window.print();
    setTimeout(() => {
      printArea.innerHTML = '';
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header (Escondido na impressão) */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-400" />
            Gerador de Etiquetas de Código de Barras
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Imprima etiquetas sem distorção em Folha A4 (várias por página) ou Rolo Térmico (50x30mm)
          </p>
        </div>
        <button onClick={handlePrint} className="btn-primary">
          <Printer className="h-4 w-4" /> Imprimir Etiquetas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configuração */}
        <div className="card p-5 space-y-4 no-print h-fit">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Configuração</h2>
          
          <div>
            <label className="label">Selecione o Produto</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) =>
                setSelectedProduct(products.find((p) => p.id === e.target.value))
              }
              className="input mt-1 text-sm font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name} — R$ {Number(p.salePrice).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Formato da Impressora / Papel</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="input mt-1 text-sm font-medium"
            >
              <option value="A4_SHEET">Folha / Cartela A4 (Grade de 3 Colunas na Mesma Folha)</option>
              <option value="THERMAL_50X30">Rolo Térmico Dedicado (Etiqueta 50mm x 30mm)</option>
            </select>
          </div>

          <div>
            <label className="label">Quantidade de Etiquetas</label>
            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="input mt-1"
            />
          </div>

          <div className="pt-2">
            <button onClick={handlePrint} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" /> Imprimir Etiquetas
            </button>
          </div>
        </div>

        {/* Pré-Visualização na Tela */}
        <div className="lg:col-span-2 card p-5 space-y-4 border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Pré-Visualização na Tela ({quantity} etiquetas)
            </h2>
            <span className="text-xs text-blue-400 font-mono bg-blue-950/60 px-2 py-1 rounded border border-blue-800">
              Modo: {format === 'A4_SHEET' ? 'Folha A4 (Grade 3 Colunas)' : 'Térmica 50x30mm'}
            </span>
          </div>

          {selectedProduct ? (
            <div
              className={
                format === 'A4_SHEET'
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                  : 'flex flex-col items-center gap-3 py-2'
              }
            >
              {Array.from({ length: quantity }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white text-black rounded border border-black p-2.5 text-center flex flex-col justify-between space-y-1 font-sans shadow-sm select-text"
                  style={{
                    width: format === 'THERMAL_50X30' ? '50mm' : '100%',
                    minHeight: format === 'THERMAL_50X30' ? '30mm' : '100px',
                  }}
                >
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-wider text-slate-800 leading-none">
                      FLAVIO CELULARES
                    </p>
                    <p className="text-[10px] font-bold leading-tight text-black my-1 break-words">
                      {selectedProduct.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black text-black leading-none mb-1">
                      R$ {Number(selectedProduct.salePrice).toFixed(2)}
                    </p>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center h-4 w-full space-x-0.5 bg-black px-1 py-0.5">
                        {Array.from({ length: 22 }).map((_, barIdx) => (
                          <div
                            key={barIdx}
                            className={`h-full ${
                              barIdx % 2 === 0
                                ? 'bg-white'
                                : barIdx % 3 === 0
                                ? 'w-1 bg-black'
                                : 'w-0.5 bg-white'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-widest text-black leading-none mt-0.5">
                        *{selectedProduct.code}*
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Carregando produtos...</p>
          )}
        </div>
      </div>
    </div>
  );
}
