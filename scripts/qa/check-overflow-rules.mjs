import fs from 'node:fs';
import path from 'node:path';

function findFiles(dir, exts, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      findFiles(p, exts, list);
    } else if (exts.some((ext) => f.endsWith(ext))) {
      list.push(p);
    }
  }
  return list;
}

const targets = [
  ...findFiles('src', ['.tsx', '.css']),
  ...findFiles('app', ['.tsx', '.css']),
];
const dangerousWidthRegex = /(?:style=\{\{[^}]*width:\s*['"]?(?:[4-9]\d{2}|\d{4,})px|(?<![a-zA-Z-])w-\[(?:[4-9]\d{2}|\d{4,})px\])/g;

let violations = 0;
for (const file of targets) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(dangerousWidthRegex) || [];
  if (matches.length > 0) {
    console.error(`ERROR: Dangerous fixed width in ${file}: ${matches.join(', ')}`);
    violations += matches.length;
  }
}

if (violations > 0) {
  console.error(`Total overflow rule violations: ${violations}`);
  process.exit(1);
} else {
  console.log(`SUCCESS: Zero dangerous fixed widths found across ${targets.length} files.`);
}
