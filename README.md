# Flavio Celulares — PDV & Assistência Técnica

Sistema unificado e inteligente para gestão de loja de celulares, assistência técnica, PDV, estoque, e CRM.

## Funcionalidades Principais

- **Frente de Caixa (PDV):** Vendas rápidas com suporte a leitura de código de barras, controle de caixa (abertura, sangria, suprimento e fechamento), cálculo de troco, descontos em % ou valor fixo, múltiplas formas de pagamento, e impressão térmica (80mm) de cupons e termos de garantia.
- **Assistência Técnica (OS):** Criação e acompanhamento de ordens de serviço e orçamentos com checklists dinâmicos, reserva automática de peças no estoque, e fluxo de aprovação com envio por WhatsApp (via API do WhatsApp).
- **Controle de Estoque:** Gestão de múltiplas condições de produto (novo, usado, defeituoso, desmanche), geração de etiquetas Code 128 para produtos.
- **Devoluções e Trocas:** Fluxo completo para substituição de produtos, controle de garantias, e devoluções para fornecedores com retorno ao estoque normal ou de produtos com defeito.
- **CRM e Clientes:** Histórico completo unificado do cliente contendo vendas, ordens de serviço, orçamentos, e trocas.
- **Relatórios Gerenciais:** Dashboard em tempo real com exportação de dados para planilhas em CSV.

## Arquitetura e Tecnologias

- **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Banco de Dados:** [SQLite](https://www.sqlite.org/) (em ambiente dev), orquestrado via [Prisma ORM](https://www.prisma.io/).
- **Autenticação:** Baseada em JWT via cookies seguros (HttpOnly).
- **Validação:** Zod.
- **UI/UX:** [Tailwind CSS](https://tailwindcss.com/), Radix UI, e ícones Lucide.

## Instalação e Uso

1. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

2. Inicialize o banco de dados e faça o seed inicial:
   \`\`\`bash
   npm run db:setup
   \`\`\`

3. Inicie o servidor em modo de desenvolvimento:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Acesse a aplicação em \`http://localhost:3000\`

**Usuários de Teste Padrão:**
- **Super Administrador:** admin@flavio.com | senha: \`flavio123\`
- **Gerente:** gerente@flavio.com | senha: \`flavio123\`
- **Técnico:** tecnico@flavio.com | senha: \`flavio123\`
- **Operador de Caixa:** caixa@flavio.com | senha: \`flavio123\`

## Estrutura do Banco de Dados

- **User**: Gerenciamento de acessos e papéis (\`SUPERADMIN\`, \`ADMIN\`, \`TECNICO\`, \`OPERADOR_CAIXA\`).
- **Product & Inventory**: Controle de SKU, código de barras, estoque reservado, estoque em mãos e estoque defeituoso.
- **Sale & SaleItem**: Registro de vendas, descontos e termos de garantia.
- **Return**: Registro de devoluções, trocas em garantia e devoluções fora de garantia, com vínculo cruzado de Vendas Originais e Vendas Substitutas.
- **ServiceOrder & Quote**: Ordens de serviço e orçamentos da assistência.
- **CashSession & Movement**: Controle financeiro rigoroso do caixa por operador.
