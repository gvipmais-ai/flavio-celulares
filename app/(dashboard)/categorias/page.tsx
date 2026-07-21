'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriasPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');

  const loadCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.data || []);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      toast.success('Categoria criada!');
      setName('');
      loadCategories();
    } else {
      toast.error('Erro ao criar categoria');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Categorias de Produtos</h1>
        <p className="text-xs text-slate-400">Organização do catálogo de itens</p>
      </div>

      <div className="card p-4">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova Categoria (ex: Capas Especiais)..."
            className="input"
            required
          />
          <button type="submit" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Adicionar Categoria
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome da Categoria</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-slate-200">{c.name}</td>
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
