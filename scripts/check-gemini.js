#!/usr/bin/env node
/**
 * check-gemini.js — Gemini API Key Health Check
 *
 * Usage: node scripts/check-gemini.js
 *
 * Reads GEMINI_API_KEY from backend/.env and makes a minimal
 * test call to confirm the key is valid and the API is reachable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (avoid needing dotenv installed at root) ──────────────
const envPath = resolve(__dirname, '../backend/.env');
let apiKey = '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
  if (match) apiKey = match[1].trim();
} catch {
  console.error('❌ Could not read backend/.env');
  process.exit(1);
}

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY is not set in backend/.env');
  process.exit(1);
}

console.log(`🔑 Key found: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
console.log('📡 Testing connection to Gemini API...\n');

// ── Health check call ────────────────────────────────────────────────────────
try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(
    'Respond with exactly: HEALTH_OK (nothing else)'
  );
  const text = result.response.text().trim();

  if (text.includes('HEALTH_OK')) {
    console.log('✅ Gemini API Key is VALID and ACTIVE');
    console.log(`   Model: gemini-2.5-flash-lite`);
    console.log(`   Response: "${text}"`);
  } else {
    console.log('⚠️  Key works but unexpected response:', text);
  }
} catch (err) {
  // 429 = quota exceeded but key IS valid (not an auth failure)
  if (err.message.includes('429') || err.message.includes('quota')) {
    console.log('✅ Gemini API Key is VALID (authenticated)');
    console.log('⚠️  Rate limit / quota exceeded — try again later.');
    process.exit(0);
  }
  console.error('❌ API call failed:', err.message.slice(0, 200));
  if (err.message.includes('API_KEY_INVALID') || err.message.includes('401')) {
    console.error('   → The API key is invalid or has been revoked.');
  } else if (err.message.includes('403')) {
    console.error('   → Permission denied. Check Gemini API is enabled in Google Cloud.');
  }
  process.exit(1);
}
