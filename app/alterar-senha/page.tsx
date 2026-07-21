'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, AlertTriangle, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>;

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMandatory = searchParams.get('obrigatorio') === 'true';
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message || 'Erro ao alterar senha');
        return;
      }

      toast.success('Senha alterada com sucesso! Faça login novamente com sua nova senha.');
      router.push('/login');
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <Smartphone className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Flavio Celulares</h1>
        </div>

        {isMandatory && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Troca de senha obrigatória</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Por razões de segurança, você precisa alterar sua senha inicial antes de continuar a navegar no sistema.
              </p>
            </div>
          </div>
        )}

        <div className="card p-6 border border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
              <p className="text-xs text-slate-400">Defina uma nova senha de acesso segura</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="label text-slate-300 text-xs font-medium">Senha Atual</label>
              <input
                type="password"
                {...register('currentPassword')}
                className={`input ${errors.currentPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.currentPassword && (
                <p className="field-error text-xs text-red-400">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="label text-slate-300 text-xs font-medium">Nova Senha</label>
              <input
                type="password"
                {...register('newPassword')}
                className={`input ${errors.newPassword ? 'input-error' : ''}`}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.newPassword && (
                <p className="field-error text-xs text-red-400">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="label text-slate-300 text-xs font-medium">Confirmar Nova Senha</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repita a nova senha"
              />
              {errors.confirmPassword && (
                <p className="field-error text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando nova senha...
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <ChangePasswordContent />
    </Suspense>
  );
}
