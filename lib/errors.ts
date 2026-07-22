import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ForbiddenError, UnauthorizedError } from './permissions';

export { ForbiddenError, UnauthorizedError };
// ─── Tipos de erro padronizados ───────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

// ─── Códigos de erro ──────────────────────────────────────────────────────────

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_OPERATION: 'INVALID_OPERATION',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  CASH_SESSION_REQUIRED: 'CASH_SESSION_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ─── Erros customizados ───────────────────────────────────────────────────────

export class NotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly code = ErrorCode.NOT_FOUND;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly code = ErrorCode.CONFLICT;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InsufficientStockError extends Error {
  public readonly statusCode = 422;
  public readonly code = ErrorCode.INSUFFICIENT_STOCK;
  constructor(productName: string, available: number, requested: number) {
    super(
      `Estoque insuficiente para "${productName}". Disponível: ${available}, solicitado: ${requested}.`
    );
    this.name = 'InsufficientStockError';
  }
}

export class InvalidOperationError extends Error {
  public readonly statusCode = 422;
  public readonly code = ErrorCode.INVALID_OPERATION;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}

export class DuplicateTransactionError extends Error {
  public readonly statusCode = 409;
  public readonly code = ErrorCode.DUPLICATE_TRANSACTION;
  constructor() {
    super('Transação duplicada detectada. Esta venda já foi processada.');
    this.name = 'DuplicateTransactionError';
  }
}

export class CashSessionRequiredError extends Error {
  public readonly statusCode = 422;
  public readonly code = ErrorCode.CASH_SESSION_REQUIRED;
  constructor() {
    super('Nenhum caixa aberto. Abra o caixa antes de realizar uma venda.');
    this.name = 'CashSessionRequiredError';
  }
}

// ─── Handler de erros para APIs ───────────────────────────────────────────────

export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Log apenas no servidor, sem stack trace ao usuário
  if (process.env['NODE_ENV'] !== 'production') {
    console.error('[API Error]', error);
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.');
      if (!fields[key]) fields[key] = [];
      fields[key]!.push(issue.message);
    }
    const firstMsg = error.issues[0]?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: firstMsg,
          fields,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: { code: ErrorCode.UNAUTHORIZED, message: error.message } },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: { code: ErrorCode.FORBIDDEN, message: error.message } },
      { status: 403 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: { code: ErrorCode.NOT_FOUND, message: error.message } },
      { status: 404 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: { code: ErrorCode.CONFLICT, message: error.message } },
      { status: 409 }
    );
  }

  if (error instanceof DuplicateTransactionError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 409 }
    );
  }

  if (error instanceof InsufficientStockError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 422 }
    );
  }

  if (error instanceof InvalidOperationError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 422 }
    );
  }

  if (error instanceof CashSessionRequiredError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 422 }
    );
  }

  // Prisma unique constraint violation
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  ) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.CONFLICT,
          message: 'Registro duplicado. Verifique os dados e tente novamente.',
        },
      },
      { status: 409 }
    );
  }

  // Erro genérico — sem stack trace
  console.error('[Unhandled Error]', error);
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Ocorreu um erro interno. Tente novamente ou contate o suporte.',
      },
    },
    { status: 500 }
  );
}
