import { verifyJWT } from '../config/auth.js';

export async function verifyToken(req, res, next) {
  const token = req.cookies['auth-token'];
  if (!token) return res.status(401).json({ message: 'Unauthenticated' });

  try {
    req.user = await verifyJWT(token); // { userId, role, isPremium }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
