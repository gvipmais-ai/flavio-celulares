'use client';

import { useState, useEffect } from 'react';
import { Palette, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    primaryColor: '#0891b2',
    secondaryColor: '#10b981',
    backgroundColor: '#020617',
    textColor: '#f8fafc',
    fontFamily: 'Inter',
    logoUrl: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/master/settings');
        const data = await res.json();
        if (data.settings) {
          setSettings({
            primaryColor: data.settings.primaryColor || '#0891b2',
            secondaryColor: data.settings.secondaryColor || '#10b981',
            backgroundColor: data.settings.backgroundColor || '#020617',
            textColor: data.settings.textColor || '#f8fafc',
            fontFamily: data.settings.fontFamily || 'Inter',
            logoUrl: data.settings.logoUrl || '',
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de layout');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/master/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      toast.success('Layout atualizado com sucesso! (Recarregue para ver efeito global se implementado)');
    } catch {
      toast.error('Erro ao atualizar layout');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-slate-400" />
          Estilização e Layout (Global)
        </h1>
        <p className="text-slate-400 mt-1">
          Altere as cores padrão e a marca do sistema para todos os usuários.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Cor Primária (HEX)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-10 w-16 p-1 bg-slate-950 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="input font-mono flex-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Cor Secundária (HEX)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="h-10 w-16 p-1 bg-slate-950 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="input font-mono flex-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Cor de Fundo (HEX)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                className="h-10 w-16 p-1 bg-slate-950 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                className="input font-mono flex-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Cor do Texto Principal (HEX)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                className="h-10 w-16 p-1 bg-slate-950 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                className="input font-mono flex-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Família de Fonte</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
              className="input mt-1"
            >
              <option value="Inter">Inter (Padrão moderno)</option>
              <option value="Roboto">Roboto (Clássico Android)</option>
              <option value="Poppins">Poppins (Arredondada/Geométrica)</option>
              <option value="sans-serif">System Sans-Serif</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">URL da Logomarca Global</label>
            <input
              type="url"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              className="input mt-1"
              placeholder="https://sua-imagem.com/logo.png"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Layout Global
          </button>
        </div>
      </form>
    </div>
  );
}
