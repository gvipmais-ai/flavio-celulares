'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MasterToken {
  id: string;
  descricao: string | null;
  criadoEm: string;
  expiraEm: string | null;
  ativo: boolean;
  criadoPor: string | null;
}

export default function MasterTokensPage() {
  const [tokens, setTokens] = useState<MasterToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [diasValidade, setDiasValidade] = useState(0); // 0 = never
  
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/master/tokens');
      const data = await res.json();
      if (data.tokens) setTokens(data.tokens);
    } catch {
      toast.error('Erro ao carregar tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/master/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao, diasValidade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);

      setGeneratedToken(data.token);
      setDescricao('');
      setDiasValidade(0);
      fetchTokens();
      toast.success('Token gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar token');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Deseja realmente revogar este token?')) return;
    try {
      const res = await fetch(`/api/master/tokens/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao revogar');
      toast.success('Token revogado');
      fetchTokens();
    } catch {
      toast.error('Erro ao revogar token');
    }
  };

  const copyToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-400">Carregando tokens...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-slate-400" />
          Gerenciamento de Tokens Mestre
        </h1>
        <p className="text-slate-400 mt-1">
          Crie, revogue e monitore quem tem acesso absoluto ao sistema.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Gerar Novo Token</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Descrição (Opcional)</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input mt-1"
              placeholder="Ex: Acesso temporário Dev"
            />
          </div>
          <div>
            <label className="label">Dias de Validade</label>
            <select
              value={diasValidade}
              onChange={(e) => setDiasValidade(Number(e.target.value))}
              className="input mt-1"
            >
              <option value={0}>Nunca expira</option>
              <option value={1}>1 Dia</option>
              <option value={7}>7 Dias</option>
              <option value={30}>30 Dias</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Gerar Token
            </button>
          </div>
        </form>

        {generatedToken && (
          <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <h3 className="text-emerald-400 font-bold mb-2">Token Gerado com Sucesso!</h3>
            <p className="text-sm text-slate-300 mb-4">Copie o token abaixo. Ele não será exibido novamente.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedToken}
                className="input flex-1 font-mono text-emerald-300 bg-slate-950 border-emerald-900"
              />
              <button
                onClick={copyToClipboard}
                className="p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Tokens Existentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
              <tr>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Criado em</th>
                <th className="px-6 py-3">Expira em</th>
                <th className="px-6 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-6 py-4">{token.descricao || 'Sem descrição'}</td>
                  <td className="px-6 py-4">
                    {token.ativo ? (
                      <span className="px-2 py-1 bg-emerald-950 text-emerald-400 rounded-full text-xs font-medium">Ativo</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-950 text-red-400 rounded-full text-xs font-medium">Revogado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{new Date(token.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    {token.expiraEm ? new Date(token.expiraEm).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {token.ativo && (
                      <button
                        onClick={() => handleRevoke(token.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Revogar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhum token encontrado. (Se estiver usando .env, ele não aparece aqui)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
