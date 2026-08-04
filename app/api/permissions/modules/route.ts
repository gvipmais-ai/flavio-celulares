import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requireModulePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { DEFAULT_MODULES_SCHEMA } from '@/lib/default-permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    await requireModulePermission(session, 'gerenciamentoCargos', 'visualizar');

    // Mapeamento extra de nomes amigáveis para as ações e módulos pode ser construído aqui 
    // ou no frontend. Retornaremos o schema padrão do sistema.
    return NextResponse.json({
      data: DEFAULT_MODULES_SCHEMA
    });
  } catch (error) {
    return handleApiError(error);
  }
}
