'use client';

import { useState, useEffect } from 'react';
import { ScrollText, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/master/logs?page=${p}&pageSize=20`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch {
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-slate-400" />
          Auditoria Mestre Imutável
        </h1>
        <p className="text-slate-400 mt-1">
          Registro de todas as operações críticas e de manutenção feitas pelos tokens mestre.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3 w-40">Data / Hora</th>
                    <th className="px-6 py-3">Ação</th>
                    <th className="px-6 py-3">Token ID (Mestre)</th>
                    <th className="px-6 py-3">IP / Contexto</th>
                    <th className="px-6 py-3 w-1/3">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                        {new Date(log.data).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-400">
                        {log.acao}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {log.mestreId || 'Desconhecido'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {log.ip || '-'} <br />
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px] inline-block" title={log.userAgent}>
                          {log.userAgent || ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400 bg-slate-950/30">
                        {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Nenhum log mestre registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between mt-auto bg-slate-900">
              <span className="text-sm text-slate-400">
                Total: <strong>{total}</strong> registros
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary py-1 px-3"
                >
                  Anterior
                </button>
                <button
                  disabled={logs.length < 20}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary py-1 px-3"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
