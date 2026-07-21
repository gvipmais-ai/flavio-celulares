import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { StoreSettingsSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const rawSettings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
    });

    const settings = rawSettings
      ? {
          ...rawSettings,
          cnpj: rawSettings.taxId || '',
        }
      : null;

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'settings:manage');

    const body = await req.json();
    const data = StoreSettingsSchema.parse(body);

    const { cnpj, ...restData } = data;
    const finalTaxId = cnpj || restData.taxId || null;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        ...restData,
        taxId: finalTaxId,
      },
      create: {
        id: 'singleton',
        ...restData,
        taxId: finalTaxId,
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'SETTINGS_UPDATED',
      entityType: 'StoreSettings',
      entityId: 'singleton',
      description: 'Configurações da loja atualizadas',
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
