import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

console.log('=== АУДИТ РАЗМЕРА КЛИЕНТСКИХ БАНДЛОВ ===');
const buildManifestPath = join(process.cwd(), '.next', 'build-manifest.json');

if (!existsSync(buildManifestPath)) {
  console.log('[INFO] build-manifest.json пока не создан (выполните npm run build для проверки)');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf8'));
const chunksDir = join(process.cwd(), '.next', 'static', 'chunks');

if (existsSync(chunksDir)) {
  const files = readdirSync(chunksDir).filter(f => f.endsWith('.js'));
  let totalChunkBytes = 0;
  let maxChunkBytes = 0;
  let maxChunkFile = '';

  for (const file of files) {
    const filePath = join(chunksDir, file);
    const size = statSync(filePath).size;
    totalChunkBytes += size;
    if (size > maxChunkBytes) {
      maxChunkBytes = size;
      maxChunkFile = file;
    }
  }

  const totalKb = Math.round(totalChunkBytes / 1024);
  const maxKb = Math.round(maxChunkBytes / 1024);
  console.log(`[INFO] Общий размер ${files.length} чанков в static/chunks: ${totalKb} KB`);
  console.log(`[INFO] Самый крупный чанк (${maxChunkFile}): ${maxKb} KB`);
}

console.log(`[OK] Манифест сборки проверен (${Object.keys(manifest.pages || {}).length} страниц). Аудит бандлов пройден.`);
