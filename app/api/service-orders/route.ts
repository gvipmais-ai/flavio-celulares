import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ServiceOrderSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:read');

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;

    const where: any = {};
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }
    if (session?.role === 'TECNICO') {
      where.OR = [{ technicianId: session.sub }, { technicianId: null }];
    }
    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { deviceModelSnapshot: { contains: search } },
        { imei: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { name: true, phone: true } },
          technician: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceOrder.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:create');

    const body = await req.json();
    const data = ServiceOrderSchema.parse(body);

    const checklistTemplates = await prisma.checklistTemplateItem.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.storeSettings.update({
        where: { id: 'singleton' },
        data: { serviceOrderSequence: { increment: 1 } },
      });
      const sequentialNumber = settings.serviceOrderSequence;

      const serviceOrder = await tx.serviceOrder.create({
        data: {
          sequentialNumber,
          customerId: data.customerId,
          deviceModelId: data.deviceModelId,
          deviceBrandSnapshot: data.deviceBrandSnapshot,
          deviceModelSnapshot: data.deviceModelSnapshot,
          imei: data.imei,
          color: data.color,
          accessoriesReceived: data.accessoriesReceived,
          reportedIssue: data.reportedIssue,
          visualCondition: data.visualCondition,
          observations: data.observations,
          technicianId: data.technicianId,
          estimatedCompletionAt: data.estimatedCompletionAt
            ? new Date(data.estimatedCompletionAt)
            : null,
          status: 'RECEBIDO',
          createdById: session!.sub,
          checklistItems: {
            create: checklistTemplates.map((t) => ({
              descriptionSnapshot: t.description,
              result: 'NAO_TESTADO',
              displayOrder: t.displayOrder,
              suggestedPartType: t.suggestedPartType,
            })),
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: 'RECEBIDO',
              notes: 'Ordem de serviço criada',
              userId: session!.sub,
            },
          },
        },
        include: { checklistItems: true, customer: true },
      });

      return serviceOrder;
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'SERVICE_ORDER_CREATED',
      entityType: 'ServiceOrder',
      entityId: result.id,
      description: `Ordem de Serviço #${result.sequentialNumber} criada para ${result.customer.name}`,
    });

    return NextResponse.json({ serviceOrder: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
