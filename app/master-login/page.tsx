'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/master/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Token inválido');
        setToken('');
        return;
      }

      toast.success('Acesso Mestre Concedido');
      router.push('/master/dashboard');
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/bg-pattern.svg')] bg-opacity-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-16 w-16 bg-red-950 rounded-full flex items-center justify-center border border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Acesso Restrito
        </h2>
        <p className="mt-2 text-center text-sm text-red-400">
          Painel Mestre de Administração
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-md py-8 px-4 shadow-2xl shadow-red-900/20 sm:rounded-xl sm:px-10 border border-red-900/50 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-300">
                Token Mestre
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="token"
                  name="token"
                  type="password"
                  autoComplete="off"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-700 rounded-lg bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm font-mono tracking-wider transition-colors"
                  placeholder="Cole o seu token mestre..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Acessar Sistema'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
