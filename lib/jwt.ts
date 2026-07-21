import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/lib/permissions';

export interface JWTPayload {
  sub: string; // userId
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresIn = process.env['JWT_EXPIRES_IN'] ?? '8h';
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JWTPayload;
}
