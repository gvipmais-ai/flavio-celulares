import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ── Store Settings ──────────────────────────────────────────────────────────
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Flavio Celulares',
      tradeName: 'Flavio Celulares',
      phone: '(11) 99999-0000',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      receiptFooterText: 'Obrigado pela preferência! Volte sempre.',
      serviceOrderTerms:
        'A loja não se responsabiliza por aparelhos deixados por mais de 90 dias.',
      defaultQuoteValidDays: 7,
      defaultMinStock: 3,
      maxOperatorDiscountPct: 10,
      allowNegativeStock: false,
      showWarrantyOnReceipt: true,
      showCostToOperator: false,
      saleSequence: 1,
      serviceOrderSequence: 1,
    },
  });
  console.log('✅ Configurações da loja criadas');

  // ── Usuários ─────────────────────────────────────────────────────────────────
  const adminHash = await bcryptjs.hash('admin123', 12);
  const gerenteHash = await bcryptjs.hash('gerente123', 12);
  const caixaHash = await bcryptjs.hash('caixa123', 12);
  const tecnicoHash = await bcryptjs.hash('tecnico123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flavio.com' },
    update: {
      passwordHash: adminHash,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
    },
    create: {
      name: 'Flavio Silva (Admin)',
      email: 'admin@flavio.com',
      passwordHash: adminHash,
      role: 'SUPERADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const caixaUser = await prisma.user.upsert({
    where: { email: 'caixa@flavio.com' },
    update: {
      passwordHash: caixaHash,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
    },
    create: {
      name: 'João Santos (Caixa)',
      email: 'caixa@flavio.com',
      passwordHash: caixaHash,
      role: 'OPERADOR_CAIXA',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const gerenteUser = await prisma.user.upsert({
    where: { email: 'gerente@flavio.com' },
    update: {
      passwordHash: gerenteHash,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
    },
    create: {
      name: 'Maria Clara (Gerente)',
      email: 'gerente@flavio.com',
      passwordHash: gerenteHash,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const tecnicoUser = await prisma.user.upsert({
    where: { email: 'tecnico@flavio.com' },
    update: {
      passwordHash: tecnicoHash,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
    },
    create: {
      name: 'Carlos Mendes (Técnico)',
      email: 'tecnico@flavio.com',
      passwordHash: tecnicoHash,
      role: 'TECNICO',
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log('✅ Usuários criados (admin, gerente, caixa, tecnico)');

  // ── Categorias ───────────────────────────────────────────────────────────────
  const categories = [
    'Capas',
    'Películas',
    'Fontes USB-A',
    'Fontes USB-C',
    'Cabos USB-C para USB-C',
    'Cabos USB-A para USB-C',
    'Cabos USB-A para Lightning',
    'Cabos USB-C para Lightning',
    'Caixas de som',
    'Microfones',
    'Copos e garrafas',
    'Baterias portáteis',
    'Fones com fio',
    'Fones sem fio',
    'Peças para manutenção',
    'Telas',
    'Baterias internas',
    'Conectores de carga',
    'Ferramentas',
  ];

  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap[name] = cat.id;
  }
  console.log(`✅ ${categories.length} categorias criadas`);

  // ── Marcas ───────────────────────────────────────────────────────────────────
  const brands = [
    { name: 'Apple', defaultWarrantyMonths: 12 },
    { name: 'Samsung', defaultWarrantyMonths: 12 },
    { name: 'Motorola', defaultWarrantyMonths: 12 },
    { name: 'Xiaomi', defaultWarrantyMonths: 12 },
    { name: 'Anker', defaultWarrantyMonths: 18 },
    { name: 'Baseus', defaultWarrantyMonths: 12 },
    { name: 'Generic', defaultWarrantyMonths: 3 },
    { name: 'JBL', defaultWarrantyMonths: 12 },
    { name: 'OEM', defaultWarrantyMonths: 3 },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of brands) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    brandMap[b.name] = brand.id;
  }
  console.log(`✅ ${brands.length} marcas criadas`);

  // Apaga os existentes para recriar de forma idempotente
  const existingCount = await prisma.checklistTemplateItem.count();
  if (existingCount === 0) {
    for (const item of checklistItems) {
      await prisma.checklistTemplateItem.create({
        data: {
          description: item.description,
          suggestedPartType: item.suggestedPartType,
          displayOrder: item.displayOrder,
        },
      });
    }
    console.log(`✅ ${checklistItems.length} itens de checklist criados`);
  } else {
    console.log('ℹ️ Checklist já existe, pulando...');
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de desenvolvimento:');
  console.log('   admin@flavio.com    / admin123   (SUPERADMIN)');
  console.log('   gerente@flavio.com  / gerente123 (ADMIN)');
  console.log('   caixa@flavio.com    / caixa123   (OPERADOR_CAIXA)');
  console.log('   tecnico@flavio.com  / tecnico123 (TECNICO)');
  console.log('\n⚠️  ATENÇÃO: Troca de senha obrigatória no primeiro acesso!');
  console.log('⚠️  Essas senhas são apenas para DESENVOLVIMENTO. Altere em produção.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
