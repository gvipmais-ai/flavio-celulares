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

  console.log('✅ Usuários criados (admin, caixa, tecnico)');

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

  // ── Fornecedor de exemplo ────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: 'seed-supplier-01' },
    update: {},
    create: {
      id: 'seed-supplier-01',
      name: 'Distribuidora Tech Brasil Ltda',
      tradeName: 'TechBrasil',
      phone: '(11) 3333-4444',
      email: 'contato@techbrasil.com.br',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
    },
  });
  console.log('✅ Fornecedor de exemplo criado');

  // ── Cliente de exemplo ───────────────────────────────────────────────────────
  await prisma.customer.upsert({
    where: { cpf: '12345678901' },
    update: {},
    create: {
      name: 'João Silva',
      cpf: '12345678901',
      phone: '(11) 99111-2222',
      email: 'joao@example.com',
    },
  });
  console.log('✅ Cliente de exemplo criado');

  // ── Modelos de dispositivos ──────────────────────────────────────────────────
  const deviceModels = [
    { brand: 'Apple', model: 'iPhone 13' },
    { brand: 'Apple', model: 'iPhone 14' },
    { brand: 'Apple', model: 'iPhone 15' },
    { brand: 'Apple', model: 'iPhone 15 Pro' },
    { brand: 'Samsung', model: 'Galaxy S23' },
    { brand: 'Samsung', model: 'Galaxy A54' },
    { brand: 'Samsung', model: 'Galaxy A34' },
    { brand: 'Motorola', model: 'Edge 40' },
    { brand: 'Motorola', model: 'Moto G84' },
    { brand: 'Xiaomi', model: 'Redmi Note 13' },
  ];

  const deviceModelMap: Record<string, string> = {};
  for (const dm of deviceModels) {
    const brandId = brandMap[dm.brand];
    if (!brandId) continue;
    const existing = await prisma.deviceModel.findFirst({
      where: { brandId, name: dm.model },
    });
    if (!existing) {
      const created = await prisma.deviceModel.create({
        data: { brandId, name: dm.model },
      });
      deviceModelMap[`${dm.brand}/${dm.model}`] = created.id;
    } else {
      deviceModelMap[`${dm.brand}/${dm.model}`] = existing.id;
    }
  }
  console.log('✅ Modelos de dispositivos criados');

  const products = [
    {
      code: '0287',
      name: 'Capa Silicone iPhone 15 Azul',
      productType: 'ACESSORIO',
      costPrice: 8.5,
      salePrice: 29.9,
      stockOnHand: 15,
      minimumStock: 5,
      warrantyMonths: 3,
      categoryId: categoryMap['Capas']!,
      brandId: brandMap['Generic']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0288',
      name: 'Película Vidro Temperado iPhone 15',
      productType: 'ACESSORIO',
      costPrice: 4.0,
      salePrice: 19.9,
      stockOnHand: 30,
      minimumStock: 10,
      warrantyMonths: 3,
      categoryId: categoryMap['Películas']!,
      brandId: brandMap['Generic']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0289',
      name: 'Cabo USB-C para USB-C 1m Baseus',
      productType: 'ACESSORIO',
      costPrice: 12.0,
      salePrice: 39.9,
      stockOnHand: 20,
      minimumStock: 8,
      warrantyMonths: 12,
      categoryId: categoryMap['Cabos USB-C para USB-C']!,
      brandId: brandMap['Baseus']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0290',
      name: 'Fonte USB-C 20W PD Anker',
      productType: 'ACESSORIO',
      costPrice: 35.0,
      salePrice: 89.9,
      stockOnHand: 10,
      minimumStock: 3,
      warrantyMonths: 18,
      categoryId: categoryMap['Fontes USB-C']!,
      brandId: brandMap['Anker']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0291',
      name: 'Tela Completa iPhone 13 Original',
      productType: 'PECA_MANUTENCAO',
      partType: 'TELA',
      costPrice: 180.0,
      salePrice: 320.0,
      stockOnHand: 3,
      minimumStock: 2,
      warrantyMonths: 90,
      categoryId: categoryMap['Telas']!,
      brandId: brandMap['OEM']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0292',
      name: 'Bateria iPhone 14 Original',
      productType: 'PECA_MANUTENCAO',
      partType: 'BATERIA',
      costPrice: 85.0,
      salePrice: 180.0,
      stockOnHand: 5,
      minimumStock: 2,
      warrantyMonths: 90,
      categoryId: categoryMap['Baterias internas']!,
      brandId: brandMap['OEM']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0293',
      name: 'Conector de Carga Samsung Galaxy A54',
      productType: 'PECA_MANUTENCAO',
      partType: 'CONECTOR_CARGA',
      costPrice: 22.0,
      salePrice: 65.0,
      stockOnHand: 4,
      minimumStock: 2,
      warrantyMonths: 90,
      categoryId: categoryMap['Conectores de carga']!,
      brandId: brandMap['OEM']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0294',
      name: 'Fone Bluetooth JBL Tune 520BT',
      productType: 'ACESSORIO',
      costPrice: 120.0,
      salePrice: 249.9,
      stockOnHand: 6,
      minimumStock: 2,
      warrantyMonths: 12,
      categoryId: categoryMap['Fones sem fio']!,
      brandId: brandMap['JBL']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0295',
      name: 'Bateria Portátil 10000mAh Anker',
      productType: 'ACESSORIO',
      costPrice: 75.0,
      salePrice: 159.9,
      stockOnHand: 8,
      minimumStock: 3,
      warrantyMonths: 18,
      categoryId: categoryMap['Baterias portáteis']!,
      brandId: brandMap['Anker']!,
      approvalStatus: 'APROVADO',
    },
    {
      code: '0296',
      name: 'Capa iPhone 15 Pro Transparente',
      productType: 'ACESSORIO',
      costPrice: 7.0,
      salePrice: 24.9,
      stockOnHand: 2,
      minimumStock: 5,
      warrantyMonths: 3,
      categoryId: categoryMap['Capas']!,
      brandId: brandMap['Generic']!,
      approvalStatus: 'APROVADO',
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { code: p.code } });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...p,
          supplierId: supplier.id,
          createdById: adminUser.id,
        } as any,
      });
    }
  }
  console.log(`✅ ${products.length} produtos criados`);

  // Compatibilidades de peças
  const tela13 = await prisma.product.findUnique({ where: { code: '0291' } });
  const bateria14 = await prisma.product.findUnique({ where: { code: '0292' } });
  const conectorA54 = await prisma.product.findUnique({ where: { code: '0293' } });

  if (tela13 && deviceModelMap['Apple/iPhone 13']) {
    await prisma.productCompatibility.upsert({
      where: {
        productId_deviceModelId: {
          productId: tela13.id,
          deviceModelId: deviceModelMap['Apple/iPhone 13'],
        },
      },
      update: {},
      create: {
        productId: tela13.id,
        deviceModelId: deviceModelMap['Apple/iPhone 13'],
      },
    });
  }

  if (bateria14 && deviceModelMap['Apple/iPhone 14']) {
    await prisma.productCompatibility.upsert({
      where: {
        productId_deviceModelId: {
          productId: bateria14.id,
          deviceModelId: deviceModelMap['Apple/iPhone 14'],
        },
      },
      update: {},
      create: {
        productId: bateria14.id,
        deviceModelId: deviceModelMap['Apple/iPhone 14'],
      },
    });
  }

  if (conectorA54 && deviceModelMap['Samsung/Galaxy A54']) {
    await prisma.productCompatibility.upsert({
      where: {
        productId_deviceModelId: {
          productId: conectorA54.id,
          deviceModelId: deviceModelMap['Samsung/Galaxy A54'],
        },
      },
      update: {},
      create: {
        productId: conectorA54.id,
        deviceModelId: deviceModelMap['Samsung/Galaxy A54'],
      },
    });
  }
  console.log('✅ Compatibilidades de peças criadas');

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

  // ── Movimentações iniciais de estoque ────────────────────────────────────────
  // Registrar entrada inicial dos produtos de exemplo
  const allProducts = await prisma.product.findMany({
    where: { stockOnHand: { gt: 0 } },
  });

  for (const product of allProducts) {
    const existingMovement = await prisma.inventoryMovement.findFirst({
      where: { productId: product.id, reason: 'ENTRADA_MERCADORIA' },
    });
    if (!existingMovement && product.stockOnHand > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          quantity: product.stockOnHand,
          direction: 'IN',
          reason: 'ENTRADA_MERCADORIA',
          previousBalance: 0,
          resultingBalance: product.stockOnHand,
          sourceType: 'SEED',
          sourceId: 'seed',
          notes: 'Estoque inicial — seed',
          userId: adminUser.id,
        },
      });
    }
  }
  console.log('✅ Movimentações iniciais de estoque registradas');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de desenvolvimento:');
  console.log('   admin@flavio.com    / admin123   (SUPERADMIN)');
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
