import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, setTokenCookie, clearTokenCookie } from '../config/auth.js';
import { verifyJWT } from '../config/auth.js';

const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

/* POST /api/auth/register */
export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });

    if (!['founder', 'collaborator'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    if (!PW_REGEX.test(password))
      return res.status(400).json({ message: 'Password must be 6+ chars with uppercase and lowercase' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email: email.toLowerCase(), passwordHash, role,
      ...(req.body.image && { image: req.body.image }),
    });

    const token = await signToken({ userId: user._id.toString(), role: user.role, isPremium: user.isPremium });
    setTokenCookie(res, token);

    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* POST /api/auth/login */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isBlocked)
      return res.status(403).json({ message: 'Your account has been suspended' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = await signToken({ userId: user._id.toString(), role: user.role, isPremium: user.isPremium });
    setTokenCookie(res, token);

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* GET /api/auth/me */
export async function me(req, res) {
  try {
    const token = req.cookies['auth-token'];
    if (!token) return res.status(401).json({ message: 'Unauthenticated' });

    const payload = await verifyJWT(token);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

/* POST /api/auth/signout */
export async function signout(_req, res) {
  clearTokenCookie(res);
  res.json({ message: 'Signed out' });
}

const ROLE_DEST = {
  admin:        '/dashboard/admin',
  founder:      '/dashboard/founder',
  collaborator: '/dashboard/collaborator',
};

/* GET /api/auth/google */
export function googleRedirect(_req, res) {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'online',
    prompt:        'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

/* GET /api/auth/google/callback */
export async function googleCallback(req, res) {
  const { code } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (!code) return res.redirect(`${clientUrl}/login?error=google_cancelled`);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
        grant_type:    'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description ?? tokens.error);

    // Get user profile from Google
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await infoRes.json();

    // Find or create user (link by googleId or email)
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email }] });
    if (user) {
      if (!user.googleId) { user.googleId = profile.sub; await user.save(); }
    } else {
      user = await User.create({
        name:     profile.name,
        email:    profile.email,
        googleId: profile.sub,
        image:    profile.picture ?? null,
        role:     'collaborator',
      });
    }

    if (user.isBlocked) return res.redirect(`${clientUrl}/login?error=blocked`);

    const token = await signToken({ userId: user._id.toString(), role: user.role, isPremium: user.isPremium });
    setTokenCookie(res, token);

    res.redirect(`${clientUrl}${ROLE_DEST[user.role] ?? '/dashboard'}`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${clientUrl}/login?error=google_failed`);
  }
}
