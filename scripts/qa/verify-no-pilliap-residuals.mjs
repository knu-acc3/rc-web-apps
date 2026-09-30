import fs from 'node:fs';
import path from 'node:path';

console.log('=== VERIFY NO PILLIAPP RESIDUALS AUDIT ===');

// 1. Verify pilliap directory is removed
if (fs.existsSync('pilliap')) {
  console.error('[FAIL] Legacy directory pilliap/ still exists on disk!');
  process.exit(1);
}
console.log('[PASS] Legacy directory pilliap/ has been completely eradicated.');

// 2. Verify all extracted data files exist
const requiredDataFiles = [
  'src/data/time-now/locations.json',
  'src/data/time-now/timezones.json',
  'src/data/actual-size/devices.json',
  'src/data/actual-size/calibration-standards.json',
  'src/data/emojis/emojis.json',
  'src/data/emojis/categories.json',
  'src/data/symbols/symbols.json',
  'src/data/symbols/kaomoji.json',
  'src/data/timers/events.json',
  'src/data/timers/presets.json',
  'src/data/catalogs/catalog-21.json',
  'src/data/catalogs/catalog-22.json',
  'src/data/catalogs/catalog-23.json',
  'src/data/catalogs/catalog-24.json',
  'src/data/catalogs/catalog-25.json',
  'src/data/catalogs/catalog-26.json',
  'src/data/catalogs/catalog-27.json',
];

for (const f of requiredDataFiles) {
  if (!fs.existsSync(f)) {
    console.error(`[FAIL] Required data file missing: ${f}`);
    process.exit(1);
  }
}
console.log(`[PASS] All ${requiredDataFiles.length} normalized data registries verified.`);

// 3. Scan src/ for any dangling pilliap imports
function scanSrc(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      count += scanSrc(p);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json')) {
      const text = fs.readFileSync(p, 'utf8');
      if (text.includes('pilliap/') || text.includes('pilliap\\')) {
        throw new Error(`Dangling reference to pilliap in ${p}`);
      }
      count++;
    }
  }
  return count;
}

const checkedCount = scanSrc('src');
console.log(`[PASS] Clean scan: 0 dangling references across ${checkedCount} source files in src/`);
console.log('SUCCESS: Monolith repository sanitization certified.');
