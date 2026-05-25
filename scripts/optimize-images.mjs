/**
 * Otimizador de imagens da galeria.
 *
 * Estratégia:
 *  - PNG do Enscape (renders pesados ~2.5MB cada) → JPEG quality 82 + resize max 1920w
 *  - JPEGs do WhatsApp (já leves) → recomprime quality 85 + resize max 1920w
 *  - Cria também versão WebP em paralelo (cada arquivo .webp)
 *  - Originais ficam preservados em assets/fotos-originais/
 *
 * Uso:
 *   node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FOTOS_DIR = path.join(ROOT, 'assets', 'fotos');
const BACKUP_DIR = path.join(ROOT, 'assets', 'fotos-originais');

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 78;

const formatBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  console.log('🖼️  Arya Offices — Otimizador de imagens\n');

  await ensureDir(BACKUP_DIR);

  const files = await fs.readdir(FOTOS_DIR);
  const imgs = files.filter((f) => /\.(png|jpe?g)$/i.test(f));

  if (imgs.length === 0) {
    console.log('Nenhuma imagem encontrada em', FOTOS_DIR);
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of imgs) {
    const src = path.join(FOTOS_DIR, file);
    const stat = await fs.stat(src);

    // Pula se já tem .webp dele (rodada anterior)
    if (file.endsWith('.webp')) continue;

    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);

    const backupPath = path.join(BACKUP_DIR, file);
    try {
      await fs.access(backupPath);
    } catch {
      await fs.copyFile(src, backupPath);
    }

    const meta = await sharp(src).metadata();

    // Decide nova extensão: PNG renders viram .jpg, JPEGs continuam .jpg
    const newExt = '.jpg';
    const newName = base + newExt;
    const newPath = path.join(FOTOS_DIR, newName);
    const webpPath = path.join(FOTOS_DIR, base + '.webp');

    const resize = meta.width && meta.width > MAX_WIDTH
      ? { width: MAX_WIDTH, withoutEnlargement: true }
      : null;

    // JPEG otimizado
    const jpegPipe = sharp(src);
    if (resize) jpegPipe.resize(resize);
    await jpegPipe
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .toFile(newPath + '.tmp');

    // WebP otimizado
    const webpPipe = sharp(src);
    if (resize) webpPipe.resize(resize);
    await webpPipe
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(webpPath);

    // Substitui o arquivo original
    if (newPath !== src) {
      // Era PNG → renomeia o tmp pra novo nome JPG e remove o PNG original
      await fs.rename(newPath + '.tmp', newPath);
      await fs.unlink(src);
    } else {
      // Era JPEG → substitui in-place
      await fs.rename(newPath + '.tmp', newPath);
    }

    const newStat = await fs.stat(newPath);
    const webpStat = await fs.stat(webpPath);

    totalBefore += stat.size;
    totalAfter += newStat.size;

    const pct = ((1 - newStat.size / stat.size) * 100).toFixed(0);
    console.log(
      `  ${file}\n` +
      `    ${formatBytes(stat.size)} → ${formatBytes(newStat.size)} (-${pct}%) · webp ${formatBytes(webpStat.size)}`
    );
  }

  console.log('\n✅ Total:');
  console.log(`   Antes: ${formatBytes(totalBefore)}`);
  console.log(`   Depois (JPEG): ${formatBytes(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
  console.log(`\n📦 Originais preservados em: ${path.relative(ROOT, BACKUP_DIR)}`);
};

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
