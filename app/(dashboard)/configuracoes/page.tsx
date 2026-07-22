'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data.settings || {});
      } catch {
        toast.error('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Configurações da loja salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          Configurações da Loja
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Parâmetros operacionais, CNPJ, dados de impressão e regras de negócio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Dados da Empresa / Impressão</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome da Loja (Nome Fantasia)</label>
              <input
                type="text"
                value={settings.name || ''}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="input"
                placeholder="Ex: Flavio Celulares"
                required
              />
            </div>

            {/* CAMPO CNPJ / CPF ADICIONADO */}
            <div>
              <label className="label">CNPJ ou CPF da Loja</label>
              <input
                type="text"
                value={settings.cnpj || settings.taxId || ''}
                onChange={(e) =>
                  setSettings({ ...settings, cnpj: e.target.value, taxId: e.target.value })
                }
                className="input font-mono font-bold text-cyan-400"
                placeholder="Ex: 00.000.000/0001-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="input"
                placeholder="Ex: (11) 99999-0000"
              />
            </div>

            <div>
              <label className="label">E-mail da Loja</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="input"
                placeholder="contato@flaviocelulares.com.br"
              />
            </div>
          </div>

          <div>
            <label className="label">Endereço Completo (Rua, Número, Bairro, Cidade)</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="input"
              placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Parâmetros Operacionais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Estoque Mínimo Padrão</label>
              <input
                type="number"
                value={settings.defaultMinStock || 3}
                onChange={(e) => setSettings({ ...settings, defaultMinStock: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Validade Padrão de Orçamentos (Dias)</label>
              <input
                type="number"
                value={settings.defaultQuoteValidDays || 7}
                onChange={(e) => setSettings({ ...settings, defaultQuoteValidDays: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Termos de Garantia (Impressão)</h2>
          <div>
            <label className="label">Cláusulas do Termo de Garantia</label>
            <textarea
              value={settings.warrantyTerms || ''}
              onChange={(e) => setSettings({ ...settings, warrantyTerms: e.target.value })}
              className="input min-h-[200px]"
              placeholder="Ex: 1. A garantia cobre apenas defeitos de fabricação..."
            />
            <p className="text-xs text-slate-500 mt-1">Este texto será impresso no comprovante de garantia do cliente.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
