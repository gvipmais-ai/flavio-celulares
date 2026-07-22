import { z } from 'zod';
import { isValidCpf, isValidImei, cleanCpf } from '../lib/formatters';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha obrigatória'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// ─── Produtos ─────────────────────────────────────────────────────────────────

export const ProductSchema = z.object({
  code: z
    .string()
    .min(1, 'Código obrigatório')
    .max(50, 'Código muito longo')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Código inválido — use apenas letras, números, hífens e underscore'),
  barcode: z.string().max(50).optional().nullable(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  description: z.string().max(1000).optional().nullable(),
  productType: z.enum(['ACESSORIO', 'PECA_MANUTENCAO']),
  partType: z
    .enum([
      'TELA',
      'BATERIA',
      'CONECTOR_CARGA',
      'CAMERA_FRONTAL',
      'CAMERA_TRASEIRA',
      'ALTO_FALANTE',
      'MICROFONE',
      'BOTAO_POWER',
      'BOTAO_VOLUME',
      'CARCACA',
      'PLACA_MAE',
      'FLEX_CARGA',
      'OUTRO',
    ])
    .optional()
    .nullable(),
  costPrice: z.coerce.number().min(0, 'Preço de custo inválido'),
  salePrice: z.coerce.number().min(0.01, 'Preço de venda deve ser maior que zero'),
  minimumStock: z.coerce.number().int().min(0),
  warrantyMonths: z.coerce.number().int().min(0),
  unit: z.string().default('UN'),
  location: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  imageUrl: z.string().url('URL de imagem inválida').optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1, 'Categoria inválida'),
  brandId: z.string().min(1, 'Marca inválida'),
  supplierId: z.string().min(1).optional().nullable(),
  compatibleDeviceModelIds: z.array(z.string().min(1)).optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;

// ─── Categorias ───────────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
});

// ─── Marcas ───────────────────────────────────────────────────────────────────

export const BrandSchema = z.object({
  name: z.string().min(1).max(100),
  defaultWarrantyMonths: z.coerce.number().int().min(0).default(0),
  description: z.string().max(500).optional().nullable(),
});

// ─── Fornecedores ─────────────────────────────────────────────────────────────

export const SupplierSchema = z.object({
  name: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(18).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ─── Clientes ─────────────────────────────────────────────────────────────────

export const CustomerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  cpf: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? cleanCpf(v) : null))
    .refine((v) => !v || isValidCpf(v), { message: 'CPF inválido' }),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable(),
});

// ─── Notas de Entrada ─────────────────────────────────────────────────────────

export const PurchaseEntryItemSchema = z.object({
  productId: z.string().min(1, 'Produto inválido'),
  quantity: z.coerce.number().int().min(1, 'Quantidade mínima é 1'),
  unitCost: z.coerce.number().min(0, 'Custo inválido'),
  discount: z.coerce.number().min(0).default(0),
});

export const PurchaseEntrySchema = z.object({
  supplierId: z.string().min(1, 'Fornecedor inválido'),
  invoiceNumber: z.string().min(1, 'Número da nota obrigatório').max(50),
  invoiceSeries: z.string().max(10).optional().nullable(),
  accessKey: z.string().max(50).optional().nullable(),
  issueDate: z.string().min(1, 'Data de emissão inválida'),
  entryDate: z.string().min(1, 'Data de entrada inválida'),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(PurchaseEntryItemSchema).min(1, 'Adicione pelo menos um item'),
});

export const CancelPurchaseEntrySchema = z.object({
  reason: z.string().min(10, 'Informe o motivo do cancelamento (mínimo 10 caracteres)').max(500),
});

// ─── Sessão de Caixa ──────────────────────────────────────────────────────────

export const OpenCashSessionSchema = z.object({
  openingAmount: z.coerce.number().min(0, 'Valor inicial inválido'),
});

export const CloseCashSessionSchema = z.object({
  informedAmount: z.coerce.number().min(0, 'Valor informado inválido'),
  notes: z.string().max(500).optional(),
});

export const CashMovementSchema = z.object({
  type: z.enum(['SUPRIMENTO', 'SANGRIA']),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  reason: z.string().min(5, 'Justificativa obrigatória (mínimo 5 caracteres)').max(300),
});

// ─── Vendas ───────────────────────────────────────────────────────────────────

export const SaleItemSchema = z.object({
  productId: z.string().cuid('Produto inválido'),
  quantity: z.coerce.number().int().min(1, 'Quantidade mínima é 1'),
  discount: z.coerce.number().min(0).default(0),
});

export const SalePaymentSchema = z.object({
  paymentMethod: z.enum([
    'DINHEIRO',
    'PIX',
    'CARTAO_DEBITO',
    'CARTAO_CREDITO',
    'TRANSFERENCIA',
    'BRINDE',
    'OUTRO',
  ]),
  amount: z.coerce.number().min(0, 'Valor do pagamento inválido'),
});

export const CreateSaleSchema = z.object({
  clientTransactionId: z.string().min(1, 'ID de transação obrigatório'),
  customerId: z.string().cuid().optional().nullable(),
  customerNameSnapshot: z.string().min(1, 'Nome do cliente obrigatório').max(200),
  customerCpfSnapshot: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? cleanCpf(v) : null)),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(SaleItemSchema).min(1, 'A venda deve ter pelo menos um item'),
  payments: z.array(SalePaymentSchema).min(1, 'Selecione pelo menos uma forma de pagamento'),
});

export const CancelSaleSchema = z.object({
  reason: z.string().min(10, 'Informe o motivo do cancelamento (mínimo 10 caracteres)').max(500),
});

// ─── Ajuste de Estoque ────────────────────────────────────────────────────────

export const StockAdjustmentSchema = z.object({
  productId: z.string().cuid('Produto inválido'),
  quantity: z.coerce.number().int().min(1, 'Quantidade mínima é 1'),
  direction: z.enum(['IN', 'OUT']),
  reason: z.string().min(10, 'Justificativa obrigatória (mínimo 10 caracteres)').max(500),
});

// ─── Ordem de Serviço ─────────────────────────────────────────────────────────

export const ServiceOrderSchema = z.object({
  customerId: z.string().cuid('Cliente inválido'),
  deviceModelId: z.string().cuid().optional().nullable(),
  deviceBrandSnapshot: z.string().min(1, 'Marca do aparelho obrigatória').max(100),
  deviceModelSnapshot: z.string().min(1, 'Modelo do aparelho obrigatório').max(100),
  imei: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || isValidImei(v), { message: 'IMEI inválido' }),
  color: z.string().max(50).optional().nullable(),
  accessoriesReceived: z.string().max(500).optional().nullable(),
  reportedIssue: z.string().min(5, 'Descreva o defeito relatado').max(1000),
  visualCondition: z.string().max(500).optional().nullable(),
  observations: z.string().max(500).optional().nullable(),
  technicianId: z.string().cuid().optional().nullable(),
  estimatedCompletionAt: z.string().datetime().optional().nullable(),
});

export const UpdateServiceOrderStatusSchema = z.object({
  status: z.enum([
    'RECEBIDO',
    'EM_DIAGNOSTICO',
    'AGUARDANDO_APROVACAO',
    'APROVADO',
    'EM_REPARO',
    'PRONTO',
    'ENTREGUE',
    'CANCELADO',
  ]),
  notes: z.string().max(500).optional().nullable(),
});

export const ChecklistUpdateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      result: z.enum(['OK', 'COM_DEFEITO', 'NAO_TESTADO', 'NAO_SE_APLICA']),
      notes: z.string().max(500).optional().nullable(),
    })
  ),
});

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export const QuoteItemSchema = z.object({
  itemType: z.enum(['PECA', 'SERVICO']),
  productId: z.string().cuid().optional().nullable(),
  descriptionSnapshot: z.string().min(1, 'Descrição obrigatória').max(300),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const CreateQuoteSchema = z.object({
  serviceOrderId: z.string().cuid('Ordem de serviço inválida'),
  diagnosis: z.string().max(2000).optional().nullable(),
  laborAmount: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  validUntil: z.string().datetime().optional().nullable(),
  estimatedDays: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(QuoteItemSchema).min(1, 'Adicione pelo menos um item ao orçamento'),
});

export const RejectQuoteSchema = z.object({
  reason: z.string().min(5, 'Informe o motivo da rejeição').max(500),
});

// ─── Configurações ────────────────────────────────────────────────────────────

export const StoreSettingsSchema = z.object({
  name: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  cnpj: z.string().max(20).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  receiptFooterText: z.string().max(500).optional().nullable(),
  serviceOrderTerms: z.string().max(2000).optional().nullable(),
  warrantyTerms: z.string().max(5000).optional().nullable(),
  defaultQuoteValidDays: z.coerce.number().int().min(1).max(365).default(7),
  defaultMinStock: z.coerce.number().int().min(0).default(3),
  maxOperatorDiscountPct: z.coerce.number().min(0).max(100).default(0),
  allowNegativeStock: z.boolean().default(false),
  showWarrantyOnReceipt: z.boolean().default(true),
  showCostToOperator: z.boolean().default(false),
});

// ─── Usuários ─────────────────────────────────────────────────────────────────

export const CreateUserSchema = z
  .object({
    name: z.string().min(2).max(200),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    role: z.enum(['SUPERADMIN', 'TECNICO', 'OPERADOR_CAIXA']),
  });

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPERADMIN', 'TECNICO', 'OPERADOR_CAIXA']).optional(),
  isActive: z.boolean().optional(),
});

// ─── Paginação ────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
