/**
 * Gera assets/og-image.jpg (1200x630) com fachada + logo light + tagline.
 * Usado em meta og:image / twitter:image — preview de link no WhatsApp, IG, etc.
 *
 * Uso: node scripts/generate-og-image.mjs
 */

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const W = 1200;
const H = 630;

const fachadaPath = resolve(root, 'assets/fotos/FachadaAryaNoite.jpg');
const logoSvgPath = resolve(root, 'assets/logo-light.svg');
const outPath = resolve(root, 'assets/og-image.jpg');

console.log('Reading sources...');
const logoSvg = await readFile(logoSvgPath, 'utf-8');

// Overlay escuro gradiente (mantém legibilidade do logo+texto)
const overlaySvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="rg" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="rgba(42, 10, 7, 0.55)"/>
      <stop offset="100%" stop-color="rgba(14, 6, 6, 0.88)"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#rg)"/>
</svg>
`);

// Texto tagline embaixo do logo
const taglineSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500&amp;display=swap');
    .eyebrow {
      font-family: 'Jost', 'Helvetica Neue', sans-serif;
      font-size: 24px;
      font-weight: 500;
      letter-spacing: 8px;
      text-transform: uppercase;
      fill: #F2EBDC;
      opacity: 0.92;
    }
    .dot { fill: #E7A930; }
  </style>
  <text x="50%" y="${H / 2 + 130}" text-anchor="middle" class="eyebrow">
    POLO TECNOLÓGICO SUL  ·  UBERLÂNDIA / MG
  </text>
</svg>
`);

// Renderiza o logo SVG num PNG buffer com width controlado
console.log('Rendering logo...');
const logoPng = await sharp(Buffer.from(logoSvg))
  .resize({ width: 540 })
  .png()
  .toBuffer();

const logoMeta = await sharp(logoPng).metadata();
const logoLeft = Math.round((W - logoMeta.width) / 2);
const logoTop = Math.round((H - logoMeta.height) / 2 - 40);

console.log('Composing...');
await sharp(fachadaPath)
  .resize({ width: W, height: H, fit: 'cover', position: 'center' })
  .composite([
    { input: overlaySvg, blend: 'over' },
    { input: logoPng, top: logoTop, left: logoLeft },
    { input: taglineSvg, blend: 'over' },
  ])
  .jpeg({ quality: 88, progressive: true, mozjpeg: true })
  .toFile(outPath);

const stat = await sharp(outPath).metadata();
const { size } = await import('node:fs').then(m => m.promises.stat(outPath));
console.log(`✓ ${outPath}`);
console.log(`  ${stat.width}x${stat.height}, ${(size / 1024).toFixed(1)} KB`);
