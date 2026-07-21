'use client';

import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        const res = await fetch('/api/audit');
        const data = await res.json();
        setLogs(data.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    loadAudit();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Logs de Auditoria</h1>
        <p className="text-xs text-slate-400">Registro histórico de todas as operações sensíveis do sistema</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Carregando auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhum registro de auditoria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="font-semibold text-slate-200">{log.user?.name || 'Sistema'}</td>
                    <td>
                      <span className="badge badge-info text-xs font-mono">{log.action}</span>
                    </td>
                    <td className="text-xs text-slate-400 font-mono">{log.entityType}</td>
                    <td className="text-xs text-slate-300">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
