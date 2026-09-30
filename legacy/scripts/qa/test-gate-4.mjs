import fs from 'node:fs';
import path from 'node:path';

function scan(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      count += scan(p);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const text = fs.readFileSync(p, 'utf8');
      if (text.includes('from "vue"') || text.includes("from 'vue'") || text.includes('@astrojs/')) {
        throw new Error('Residual Vue/Astro import in: ' + p);
      }
      count++;
    }
  }
  return count;
}

const scanned = scan('src');
console.log(`SUCCESS: Zero Vue/Astro residuals across ${scanned} source files in src/`);
