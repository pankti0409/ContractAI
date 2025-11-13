import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const { email, password, firstName, lastName, company } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
    const user = await User.create({ email, passwordHash, name, firstName, lastName, company, role: 'user' });
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return res.json({
      accessToken: token,
      user: { id: user.id, email: user.email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', company: user.company }
    });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return res.json({ accessToken: token, user: { id: user.id, email: user.email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', company: user.company } });
  }
);

// Refresh token: requires a valid token, issues a new short-lived token
router.post('/refresh', requireAuth, async (req, res) => {
  const auth = (req as any).auth as { sub: string; role: 'user' | 'admin' };
  const user = await User.findById(auth.sub);
  if (!user) return res.status(401).json({ message: 'Invalid token' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  return res.json({ accessToken: token });
});

router.post('/admin/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return res.json({ accessToken: token, admin: { id: user.id, email: user.email, name: user.name } });
  }
);

// Update profile details for authenticated user
router.put('/profile', requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const { firstName, lastName, company } = req.body as { firstName?: string; lastName?: string; company?: string };
  const user = await User.findById(auth.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (typeof firstName !== 'undefined') user.firstName = firstName;
  if (typeof lastName !== 'undefined') user.lastName = lastName;
  if (typeof company !== 'undefined') user.company = company;
  user.name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined;
  await user.save();
  return res.json({
    user: { id: user.id, email: user.email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', company: user.company }
  });
});

export default router;