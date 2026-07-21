'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type ProductInput } from '@/lib/validations';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: {
      code: '0' + Math.floor(1000 + Math.random() * 9000),
      productType: 'ACESSORIO',
      costPrice: 0,
      salePrice: 0,
      minimumStock: 3,
      warrantyMonths: 3,
      unit: 'UN',
    },
  });

  const productType = watch('productType');

  useEffect(() => {
    async function loadData() {
      try {
        const [resCat, resBrand] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);
        const dataCat = await resCat.json();
        const dataBrand = await resBrand.json();

        setCategories(dataCat.data || []);
        setBrands(dataBrand.data || []);

        if (dataCat.data?.[0]) setValue('categoryId', dataCat.data[0].id);
        if (dataBrand.data?.[0]) setValue('brandId', dataBrand.data[0].id);
      } catch {
        toast.error('Erro ao carregar categorias/marcas');
      }
    }
    loadData();
  }, [setValue]);

  const onSubmit = async (data: ProductInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message || 'Erro ao criar produto');
        return;
      }

      toast.success('Produto cadastrado com sucesso!');
      router.push('/produtos');
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/produtos" className="btn-ghost btn-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Novo Produto</h1>
          <p className="text-xs text-slate-400">Cadastre um novo produto no catálogo</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Código (preserva zeros à esquerda)</label>
              <input type="text" {...register('code')} className="input font-mono" />
              {errors.code && <p className="field-error">{errors.code.message}</p>}
            </div>

            <div>
              <label className="label">Código de Barras (opcional)</label>
              <input type="text" {...register('barcode')} className="input font-mono" placeholder="Ex: 7891234567890" />
            </div>
          </div>

          <div>
            <label className="label">Nome do Produto</label>
            <input type="text" {...register('name')} className="input" placeholder="Ex: Capa Silicone iPhone 15 Azul" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Tipo de Produto</label>
              <select {...register('productType')} className="input">
                <option value="ACESSORIO">Acessório</option>
                <option value="PECA_MANUTENCAO">Peça de Manutenção</option>
              </select>
            </div>

            <div>
              <label className="label">Categoria</label>
              <select {...register('categoryId')} className="input">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Marca</label>
              <select {...register('brandId')} className="input">
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {productType === 'PECA_MANUTENCAO' && (
            <div>
              <label className="label">Tipo de Peça (Manutenção)</label>
              <select {...register('partType')} className="input">
                <option value="TELA">Tela</option>
                <option value="BATERIA">Bateria</option>
                <option value="CONECTOR_CARGA">Conector de Carga</option>
                <option value="CAMERA_FRONTAL">Câmera Frontal</option>
                <option value="CAMERA_TRASEIRA">Câmera Traseira</option>
                <option value="ALTO_FALANTE">Alto-falante</option>

                <option value="MICROFONE">Microfone</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Preço de Custo (R$)</label>
              <input type="number" step="0.01" {...register('costPrice')} className="input" />
              {errors.costPrice && <p className="field-error">{errors.costPrice.message}</p>}
            </div>

            <div>
              <label className="label">Preço de Venda (R$)</label>
              <input type="number" step="0.01" {...register('salePrice')} className="input" />
              {errors.salePrice && <p className="field-error">{errors.salePrice.message}</p>}
            </div>

            <div>
              <label className="label">Estoque Mínimo</label>
              <input type="number" {...register('minimumStock')} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Garantia (Meses)</label>
              <input type="number" {...register('warrantyMonths')} className="input" />
            </div>
            <div>
              <label className="label">Localização Física (Prateleira/Gaveta)</label>
              <input type="text" {...register('location')} className="input" placeholder="Ex: A-12" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link href="/produtos" className="btn-secondary">
              Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
