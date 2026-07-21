'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NovaOrdemPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('iPhone 13');
  const [imei, setImei] = useState('');
  const [color, setColor] = useState('');
  const [accessories, setAccessories] = useState('');
  const [reportedIssue, setReportedIssue] = useState('');
  const [visualCondition, setVisualCondition] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        setCustomers(data.data || []);
        if (data.data?.[0]) setCustomerId(data.data[0].id);
      } catch {
        toast.error('Erro ao carregar clientes');
      }
    }
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
          visualCondition,
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
            <label className="label">Cliente</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="input"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.cpf ? `(${c.cpf})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Marca do Aparelho</label>
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
              <label className="label">Modelo do Aparelho</label>
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
              <label className="label">Cor</label>
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
            <label className="label">Acessórios Entregues Junto</label>
            <input
              type="text"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              className="input"
              placeholder="Ex: Capa, Cabo, Carregador, Chip"
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

          <div>
            <label className="label">Estado Visual / Marcas de Uso</label>
            <textarea
              value={visualCondition}
              onChange={(e) => setVisualCondition(e.target.value)}
              className="input h-20"
              placeholder="Ex: Riscados na tampa traseira, marcas de queda no canto superior..."
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
    </div>
  );
}
