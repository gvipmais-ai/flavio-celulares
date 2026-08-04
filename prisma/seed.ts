import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { getSuperAdminPermissions, getTecnicoPermissions, getOperadorCaixaPermissions } from '../lib/default-permissions';

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

  // ── Cargos ───────────────────────────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SuperADMIN' },
    update: { permissions: JSON.stringify(getSuperAdminPermissions()), isSystem: true },
    create: {
      name: 'SuperADMIN',
      description: 'Acesso total ao sistema',
      permissions: JSON.stringify(getSuperAdminPermissions()),
      isSystem: true,
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Gerente' },
    update: { permissions: JSON.stringify(getSuperAdminPermissions()), isSystem: true },
    create: {
      name: 'Gerente',
      description: 'Acesso gerencial ao sistema',
      permissions: JSON.stringify(getSuperAdminPermissions()), // Similar to superadmin for now
      isSystem: true,
    }
  });

  const tecnicoRole = await prisma.role.upsert({
    where: { name: 'Técnico' },
    update: { permissions: JSON.stringify(getTecnicoPermissions()), isSystem: true },
    create: {
      name: 'Técnico',
      description: 'Acesso focado na assistência técnica',
      permissions: JSON.stringify(getTecnicoPermissions()),
      isSystem: true,
    }
  });

  const caixaRole = await prisma.role.upsert({
    where: { name: 'Operador de Caixa' },
    update: { permissions: JSON.stringify(getOperadorCaixaPermissions()), isSystem: true },
    create: {
      name: 'Operador de Caixa',
      description: 'Acesso focado em vendas e caixa',
      permissions: JSON.stringify(getOperadorCaixaPermissions()),
      isSystem: true,
    }
  });

  console.log('✅ Cargos padrões criados');

  const adminHash = await bcryptjs.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flaviocelulares.com.br' },
    update: {
      passwordHash: adminHash,
      loginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: true,
    },
    create: {
      name: 'Administrador',
      email: 'admin@flaviocelulares.com.br',
      passwordHash: adminHash,
      roleId: superAdminRole.id,
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log('✅ Usuário principal criado (Administrador)');
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

  // ── Checklist Template ───────────────────────────────────────────────────────
  const checklistItems = [
    { description: 'Tela', category: 'Display', suggestedPartType: 'TELA', displayOrder: 1 },
    { description: 'Touch', category: 'Display', displayOrder: 2 },
    { description: 'Botão de ligar', category: 'Botões', suggestedPartType: 'BOTAO_POWER', displayOrder: 3 },
    { description: 'Botões de volume', category: 'Botões', suggestedPartType: 'BOTAO_VOLUME', displayOrder: 4 },
    { description: 'Câmera frontal', category: 'Câmeras', suggestedPartType: 'CAMERA_FRONTAL', displayOrder: 5 },
    { description: 'Câmera traseira', category: 'Câmeras', suggestedPartType: 'CAMERA_TRASEIRA', displayOrder: 6 },
    { description: 'Flash', category: 'Câmeras', displayOrder: 7 },
    { description: 'Microfone', category: 'Áudio', suggestedPartType: 'MICROFONE', displayOrder: 8 },
    { description: 'Alto-falante', category: 'Áudio', suggestedPartType: 'ALTO_FALANTE', displayOrder: 9 },
    { description: 'Auricular', category: 'Áudio', displayOrder: 10 },
    { description: 'Conector de carga', category: 'Conectividade', suggestedPartType: 'CONECTOR_CARGA', displayOrder: 11 },
    { description: 'Carregamento', category: 'Conectividade', displayOrder: 12 },
    { description: 'Wi-Fi', category: 'Conectividade', displayOrder: 13 },
    { description: 'Bluetooth', category: 'Conectividade', displayOrder: 14 },
    { description: 'Chip e rede móvel', category: 'Conectividade', displayOrder: 15 },
    { description: 'Biometria', category: 'Segurança', displayOrder: 16 },
    { description: 'Face ID / Reconhecimento facial', category: 'Segurança', displayOrder: 17 },
    { description: 'Vibração', category: 'Hardware', displayOrder: 18 },
    { description: 'Estado da carcaça', category: 'Visual', suggestedPartType: 'CARCACA', displayOrder: 19 },
    { description: 'Sinais de oxidação', category: 'Visual', displayOrder: 20 },
    { description: 'Parafusos ou lacres violados', category: 'Visual', displayOrder: 21 },
  ];

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
  console.log('\n📋 Credencial de acesso mestre gerada:');
  console.log('   admin@flaviocelulares.com.br / admin123   (SUPERADMIN)');
  console.log('\n⚠️  ATENÇÃO: Troca de senha obrigatória no primeiro acesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
