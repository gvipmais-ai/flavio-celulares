'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { maskCpf, maskPhone } from '@/lib/formatters';
import { toast } from 'sonner';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setCustomers(data.data || []);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cpf: cpf || null, phone, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar cliente');
        return;
      }

      toast.success('Cliente cadastrado com sucesso!');
      setShowModal(false);
      setName('');
      setCpf('');
      setPhone('');
      setEmail('');
      loadCustomers();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Cadastro de Clientes</h1>
          <p className="text-xs text-slate-400">Gerencie a base de clientes da loja</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Carregando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-slate-800/50" onClick={() => window.location.href = \`/clientes/\${c.id}\`}>
                    <td className="font-semibold text-slate-200">{c.name}</td>
                    <td className="font-mono text-xs">{c.cpf ? maskCpf(c.cpf) : '—'}</td>
                    <td>{c.phone ? maskPhone(c.phone) : '—'}</td>
                    <td className="text-slate-400">{c.email || '—'}</td>
                    <td>
                      <span className="badge badge-success">Ativo</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Novo Cliente</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="label">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">CPF (opcional)</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="input font-mono"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
