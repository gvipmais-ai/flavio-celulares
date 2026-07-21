'use client';

import React, { useEffect, useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MarcasPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [warranty, setWarranty] = useState(12);

  const loadBrands = async () => {
    const res = await fetch('/api/brands');
    const data = await res.json();
    setBrands(data.data || []);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, defaultWarrantyMonths: warranty }),
    });
    if (res.ok) {
      toast.success('Marca criada!');
      setName('');
      loadBrands();
    } else {
      toast.error('Erro ao criar marca');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Marcas de Fabricantes</h1>
        <p className="text-xs text-slate-400">Marcas de produtos e compatibilidades de aparelhos</p>
      </div>

      <div className="card p-4">
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Nome da Marca</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Anker, Baseus, Apple..."
              className="input"
              required
            />
          </div>
          <div className="w-40">
            <label className="label">Garantia (Meses)</label>
            <input
              type="number"
              value={warranty}
              onChange={(e) => setWarranty(Number(e.target.value))}
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Adicionar Marca
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome da Marca</th>
                <th>Garantia Padrão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold text-slate-200">{b.name}</td>
                  <td>{b.defaultWarrantyMonths} meses</td>
                  <td>
                    <span className="badge badge-success">Ativa</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
