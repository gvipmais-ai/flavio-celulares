import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ChecklistUpdateSchema } from '@/lib/validations';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'checklist:fill');

    const body = await req.json();
    const data = ChecklistUpdateSchema.parse(body);

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!serviceOrder) throw new NotFoundError('Ordem de serviço não encontrada');

    await prisma.$transaction(
      data.items.map((item) =>
        prisma.serviceChecklistItem.update({
          where: { id: item.id },
          data: {
            result: item.result,
            notes: item.notes,
          },
        })
      )
    );

    const updatedChecklist = await prisma.serviceChecklistItem.findMany({
      where: { serviceOrderId: id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ checklistItems: updatedChecklist });
  } catch (error) {
    return handleApiError(error);
  }
}
