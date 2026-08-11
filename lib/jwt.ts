import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  sub: string; // userId
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  scope?: string;
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

export async function signToken(payload: Partial<JWTPayload>): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JWTPayload;
}
