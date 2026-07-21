'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const loadSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    const data = await res.json();
    setSuppliers(data.data || []);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      toast.success('Fornecedor cadastrado!');
      setName('');
      setPhone('');
      loadSuppliers();
    } else {
      toast.error('Erro ao cadastrar fornecedor');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Fornecedores</h1>
        <p className="text-xs text-slate-400">Distribuidoras e parceiros de peças e acessórios</p>
      </div>

      <div className="card p-4">
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Razão Social / Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Distribuidora Tech Brasil Ltda"
              className="input"
              required
            />
          </div>
          <div className="w-48">
            <label className="label">Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="(11) 3333-4444"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Cadastrar Fornecedor
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Telefone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-slate-200">{s.name}</td>
                  <td>{s.phone || '—'}</td>
                  <td>
                    <span className="badge badge-success">Ativo</span>
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
