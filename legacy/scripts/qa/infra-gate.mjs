import fs from 'node:fs';
import path from 'node:path';

console.log('=== INFRASTRUCTURE & SECURITY GATE AUDIT ===');

// 1. Check next.config.ts
const nextConfigPath = path.resolve('next.config.ts');
if (!fs.existsSync(nextConfigPath)) {
  console.error('[FAIL] next.config.ts not found!');
  process.exit(1);
}

const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
if (!nextConfigContent.includes('standalone')) {
  console.error('[FAIL] output: "standalone" is missing in next.config.ts!');
  process.exit(1);
}
console.log('[PASS] Standalone output configured in next.config.ts');

if (!nextConfigContent.includes('Content-Security-Policy')) {
  console.error('[FAIL] Content-Security-Policy header is missing in next.config.ts!');
  process.exit(1);
}
console.log('[PASS] Content-Security-Policy header configured');

// 2. Check PWA assets
if (!fs.existsSync('public/manifest.webmanifest') && !fs.existsSync('public/manifest.json')) {
  console.error('[FAIL] PWA manifest is missing in public/!');
  process.exit(1);
}
console.log('[PASS] PWA Web Manifest verified');

if (!fs.existsSync('public/offline.html')) {
  console.error('[FAIL] public/offline.html is missing!');
  process.exit(1);
}
console.log('[PASS] Offline fallback page verified');

console.log('SUCCESS: All Gate 6 infrastructure and security requirements verified.');
