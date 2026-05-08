/**
 * createAdmin.js — Run once to seed the admin account.
 * Usage: node backend/scripts/createAdmin.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// ── Admin credentials — change these before running ──────────────────────────
const ADMIN_NAME     = 'Smriti Admin';
const ADMIN_EMAIL    = 'admin@smriti.health';
const ADMIN_PASSWORD = 'Admin@Smriti2024!';

async function createAdmin() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Dynamically import User model
    const { default: User } = await import('../models/User.js');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log('✅ Existing user promoted to admin:', ADMIN_EMAIL);
        } else {
            console.log('ℹ️  Admin already exists:', ADMIN_EMAIL);
        }
        await mongoose.disconnect();
        return;
    }

    const salt     = await bcrypt.genSalt(10);
    const hashed   = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
        name:     ADMIN_NAME,
        email:    ADMIN_EMAIL,
        password: hashed,
        role:     'admin',
    });

    console.log('');
    console.log('✅ Admin account created successfully!');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   ⚠️  Change this password after first login.');
    console.log('');

    await mongoose.disconnect();
}

createAdmin().catch(err => {
    console.error('Failed to create admin:', err);
    process.exit(1);
});
