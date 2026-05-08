/**
 * seedAdmin.js — Bootstrap the first admin account
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *   node scripts/seedAdmin.js admin@alzdetect.com MyPassword123
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const [,, emailArg, passwordArg] = process.argv;

const ADMIN_EMAIL    = emailArg    || 'admin@alzdetect.com';
const ADMIN_PASSWORD = passwordArg || 'Admin@123';
const ADMIN_NAME     = 'Smriti Admin';

async function seed() {
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        console.error('❌  No MONGODB_URI or MONGO_URI found in .env');
        process.exit(1);
    }

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log(`🔄  Upgraded existing user "${ADMIN_EMAIL}" to admin role.`);
        } else {
            console.log(`ℹ️   Admin account already exists: ${ADMIN_EMAIL}`);
        }
        await mongoose.disconnect();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
        name:     ADMIN_NAME,
        email:    ADMIN_EMAIL,
        password: hashedPassword,
        role:     'admin',
    });

    console.log('');
    console.log('✅  Admin account created successfully!');
    console.log('─────────────────────────────────────');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log('─────────────────────────────────────');
    console.log('');

    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
