import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export async function seedAdminIfConfigured() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const exists = await User.findOne({ email, role: 'admin' });
  if (exists) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, role: 'admin', name: 'Admin' });
  console.log(`👤 Seeded admin account: ${email}`);
}