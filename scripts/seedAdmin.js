import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const ADMIN_EMAIL    = 'shariful.ire@gmail.com';
const ADMIN_PASSWORD = 'Shariful@1234';
const ADMIN_NAME     = 'Shariful Islam';

await mongoose.connect(process.env.MONGODB_URI);

const existing = await User.findOne({ email: ADMIN_EMAIL });

if (existing) {
  if (existing.role === 'admin') {
    console.log('✅ Admin already exists — no changes made.');
  } else {
    existing.role         = 'admin';
    existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await existing.save();
    console.log('✅ Existing user promoted to admin.');
  }
} else {
  await User.create({
    name:         ADMIN_NAME,
    email:        ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role:         'admin',
  });
  console.log('✅ Admin user created successfully.');
}

console.log(`   Email:    ${ADMIN_EMAIL}`);
console.log(`   Password: ${ADMIN_PASSWORD}`);
await mongoose.disconnect();
