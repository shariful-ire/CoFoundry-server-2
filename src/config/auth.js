import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret());
}

export async function verifyJWT(token) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

export function setTokenCookie(res, token) {
  res.cookie('auth-token', token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

export function clearTokenCookie(res) {
  res.clearCookie('auth-token', { httpOnly: true, sameSite: 'lax' });
}
