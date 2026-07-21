# Flavio Celulares — Sistema de Gestão Comercial e Assistência Técnica

Sistema web completo para gestão de loja física de acessórios e assistência técnica de celulares. Construído com **Next.js 14 (App Router)**, **TypeScript**, **PostgreSQL** e **Prisma ORM**.

---

## 🚀 Funcionalidades Principais

- **Frente de Caixa (PDV)**: Vendas rápidas com leitor de código de barras, atalhos de teclado e emissão de comprovante não fiscal.
- **Controle de Estoque Transacional**: Separação de estoque físico e reservado para ordens de serviço. Impede estoque negativo com locks de concorrência.
- **Assistência Técnica Completa**: Ordens de serviço com checklist de recebimento, orçamentos versionados, sugestão de peças compatíveis, reserva e consumo automático do estoque.
- **Compras & Notas de Entrada**: Controle de fornecedores, rascunho e confirmação de notas fiscais com atualização imutável do estoque e proteção contra duplicidades.
- **Gerador de Etiquetas**: Etiquetas Code 128 com preço e código de produto prontas para impressora térmica ou folhas A4.
- **Controle de Acesso (RBAC)**: Três perfis de usuário (`OPERADOR_CAIXA`, `TECNICO`, `SUPERADMIN`) com permissões validadas estritamente no backend.
- **Logs de Auditoria**: Registro completo e rastreável de todas as movimentações e operações sensíveis.

---

## 📋 Pré-requisitos

- **Node.js**: versão 18+ ou 20+ LTS
- **PostgreSQL**: banco de dados relacional (compatível com Neon, Supabase ou PostgreSQL nativo do Replit)
- **npm**: gerenciador de pacotes

---

## ⚙️ Configuração do Ambiente (.env)

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Preencha as seguintes variáveis:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/flavio_celulares?sslmode=require"
JWT_SECRET="SEGREDO_SUPER_SEGURO_COM_PELO_MENOS_32_CARACTERES"
JWT_EXPIRES_IN="8h"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🛠️ Passo a Passo para Execução Local / Replit

### 1. Instalar dependências
```bash
npm install
```

### 2. Gerar Prisma Client e rodar Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 3. Executar o Seed Inicial (Dados de demonstração)
```bash
npm run db:seed
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 🔐 Credenciais de Desenvolvimento (Criadas no Seed)

| E-mail | Senha Inicial | Cargo | Permissões |
|--------|---------------|-------|------------|
| `admin@flavio.com` | `admin123` | `SUPERADMIN` | Acesso total ao sistema |
| `caixa@flavio.com` | `caixa123` | `OPERADOR_CAIXA` | Caixa, Vendas e Consulta |
| `tecnico@flavio.com` | `tecnico123` | `TECNICO` | Ordens de Serviço e Orçamentos |

> ⚠️ **ATENÇÃO**: Todos os usuários do seed estão configurados com `mustChangePassword: true`. O sistema exigirá a troca de senha obrigatoriamente no primeiro login.

---

## 🧪 Execução de Testes e Validação

```bash
# Rodar testes unitários e de integração (Vitest)
npm test

# Executar verificação de tipos (TypeScript)
npm run typecheck

# Executar Linter (ESLint)
npm run lint

# Executar build de produção
npm run build
```

---

## 🧾 Nota Importante sobre Documentos Gerados

Os comprovantes gerados pelo sistema são **Comprovantes de Venda Não Fiscais**. O sistema não realiza integração nativa com a SEFAZ para emissão de NFC-e/SAT nem controle direto de drivers de impressora local, gerando PDFs padrão de 80mm e A4 compatíveis com a janela de impressão nativa de qualquer navegador.
