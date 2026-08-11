'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NovaOrdemPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [color, setColor] = useState('');
  const [accessories, setAccessories] = useState('');
  const [reportedIssue, setReportedIssue] = useState('');

  // Quick Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  async function loadCustomers(selectId?: string) {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.data || []);
      if (selectId) {
        setCustomerId(selectId);
      } else if (data.data?.[0] && !customerId) {
        setCustomerId(data.data[0].id);
      }
    } catch {
      toast.error('Erro ao carregar clientes');
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Selecione um cliente');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          deviceBrandSnapshot: deviceBrand,
          deviceModelSnapshot: deviceModel,
          imei: imei || null,
          color,
          accessoriesReceived: accessories,
          reportedIssue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar Ordem de Serviço');
        return;
      }

      toast.success(`OS #${data.serviceOrder.sequentialNumber} criada com sucesso!`);
      router.push(`/ordens/${data.serviceOrder.id}`);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar cliente');
        return;
      }

      toast.success('Cliente cadastrado com sucesso!');
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      
      // Reload and auto-select new customer
      loadCustomers(data.customer.id);
    } catch {
      toast.error('Erro de conexão ao cadastrar cliente');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ordens" className="btn-ghost btn-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nova Ordem de Serviço</h1>
          <p className="text-xs text-slate-400">Registre a entrada de um aparelho na assistência</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Cliente *</label>
              <button 
                type="button" 
                onClick={() => setShowCustomerModal(true)}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" /> Novo Cliente
              </button>
            </div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="input"
              required
            >
              <option value="" disabled>Selecione um cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.cpf ? `(${c.cpf})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Marca do Aparelho *</label>
              <input
                type="text"
                required
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
                className="input"
                placeholder="Ex: Apple, Samsung, Motorola"
              />
            </div>

            <div>
              <label className="label">Modelo do Aparelho *</label>
              <input
                type="text"
                required
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="input"
                placeholder="Ex: iPhone 13, Galaxy A54"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">IMEI (opcional)</label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="input font-mono"
                placeholder="15 dígitos"
              />
            </div>

            <div>
              <label className="label">Cor (opcional)</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="input"
                placeholder="Ex: Preto, Azul, Dourado"
              />
            </div>
          </div>

          <div>
            <label className="label">Acessórios Deixados Pelo Cliente (opcional)</label>
            <input
              type="text"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              className="input"
              placeholder="Ex: Capa preta, Película trincada, Chip da Claro..."
            />
          </div>

          <div>
            <label className="label">Defeito Relatado pelo Cliente *</label>
            <textarea
              required
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className="input h-24"
              placeholder="Ex: Tela quebrada, aparelho não liga após queda..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link href="/ordens" className="btn-secondary">
              Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abrir Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>

      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastro Rápido</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Telefone (opcional)</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

