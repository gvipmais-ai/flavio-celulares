'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smartphone, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    // Focus no campo de e-mail ao carregar
    document.getElementById('email')?.focus();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.fields) {
          Object.entries(json.error.fields as Record<string, string[]>).forEach(([field, msgs]) => {
            setError(field as keyof LoginForm, { message: msgs[0] });
          });
        } else {
          toast.error(json.error?.message ?? 'Erro ao fazer login');
        }
        return;
      }

      toast.success('Login realizado com sucesso!');

      if (json.user?.mustChangePassword) {
        router.push('/alterar-senha?obrigatorio=true');
      } else {
        router.push('/dashboard');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, hsl(217, 91%, 20%) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(199, 89%, 15%) 0%, transparent 50%)',
        }}
      />
      <div className="absolute inset-0">
        <div
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'hsl(217, 91%, 50%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'hsl(199, 89%, 50%)' }}
        />
      </div>

      {/* Login card */}
      <div className="glass-card relative z-10 w-full max-w-md p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Smartphone className="h-9 w-9 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Flavio Celulares</h1>
            <p className="mt-1 text-sm text-slate-400">Sistema de Gestão</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* E-mail */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="label">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="field-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="label">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
              />
            </div>
            {errors.password && (
              <p className="field-error flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Flavio Celulares © {new Date().getFullYear()} · Sistema interno
        </p>
      </div>
    </div>
  );
}
