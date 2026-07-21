import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/cookies';

// Rotas públicas — não requerem autenticação
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

// Rotas de API — devolvem JSON em vez de redirecionar
const API_PREFIX = '/api';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permite recursos estáticos e Next.js internos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Rotas públicas passam direto
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  // Usuário não autenticado
  if (!session) {
    if (pathname.startsWith(API_PREFIX)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Não autenticado. Faça login.' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado tentando acessar /login → redireciona ao dashboard
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Adiciona headers com dados do usuário para Server Components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', session.sub);
  requestHeaders.set('x-user-email', session.email);
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-user-name', session.name);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
