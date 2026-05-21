#!/usr/bin/env node
// Genera todos los icons Android desde assets/app-icon.svg + app-icon-foreground.svg.
//
// Outputs:
//   android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/
//     - ic_launcher.png        (legacy, square con bordes redondeados via SVG rx)
//     - ic_launcher_round.png  (legacy round, mismo SVG con mask circular)
//     - ic_launcher_foreground.png (adaptive icon foreground, panda sobre transparente)
//
// El background del adaptive icon es color sólido definido en
// android/app/src/main/res/values/ic_launcher_background.xml (clay #C97B5A).
//
// Densidades Android (Material guidelines):
//   mdpi    1x  48dp  -> 48px   legacy  / 108px foreground
//   hdpi    1.5 72dp  -> 72px           / 162px
//   xhdpi   2x  96dp  -> 96px           / 216px
//   xxhdpi  3x  144dp -> 144px          / 324px
//   xxxhdpi 4x  192dp -> 192px          / 432px

import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(process.cwd());
const SVG_FULL = readFileSync(join(ROOT, 'assets/app-icon.svg'));
const SVG_FOREGROUND = readFileSync(join(ROOT, 'assets/app-icon-foreground.svg'));

const RES_DIR = join(ROOT, 'android/app/src/main/res');

// [folderSuffix, legacyPx, foregroundPx]
const DENSITIES = [
  ['mdpi',     48,  108],
  ['hdpi',     72,  162],
  ['xhdpi',    96,  216],
  ['xxhdpi',   144, 324],
  ['xxxhdpi',  192, 432],
];

console.log('================================================');
console.log('[gen-icons] Husu Habits Android mipmaps');
console.log(`[gen-icons] ROOT: ${ROOT}`);
console.log('================================================');

// Helper: rasterize SVG buffer at exact size
async function renderSvg(svgBuf, size) {
  return sharp(svgBuf, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Helper: create circular mask of given size
function makeCircleMask(size) {
  const r = size / 2;
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
  </svg>`;
  return Buffer.from(svg);
}

let total = 0;
for (const [suffix, legacyPx, fgPx] of DENSITIES) {
  const outDir = join(RES_DIR, `mipmap-${suffix}`);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    console.log(`[gen-icons] created ${outDir}`);
  }

  // 1. ic_launcher.png (legacy square — el SVG full ya tiene corner radius 22%)
  const legacyBuf = await renderSvg(SVG_FULL, legacyPx);
  await sharp(legacyBuf).png().toFile(join(outDir, 'ic_launcher.png'));
  console.log(`[gen-icons] ${suffix}/ic_launcher.png (${legacyPx}x${legacyPx})`);
  total++;

  // 2. ic_launcher_round.png (legacy round — aplicar mask circular)
  const roundMask = makeCircleMask(legacyPx);
  await sharp(legacyBuf)
    .composite([{ input: roundMask, blend: 'dest-in' }])
    .png()
    .toFile(join(outDir, 'ic_launcher_round.png'));
  console.log(`[gen-icons] ${suffix}/ic_launcher_round.png (${legacyPx}x${legacyPx} circle)`);
  total++;

  // 3. ic_launcher_foreground.png (adaptive foreground, panda only)
  const fgBuf = await renderSvg(SVG_FOREGROUND, fgPx);
  await sharp(fgBuf).png().toFile(join(outDir, 'ic_launcher_foreground.png'));
  console.log(`[gen-icons] ${suffix}/ic_launcher_foreground.png (${fgPx}x${fgPx})`);
  total++;
}

// Also generate Play Store icon (512x512 PNG) for Play Console
const playStoreOut = join(ROOT, 'assets/app-icon-512.png');
const playBuf = await renderSvg(SVG_FULL, 512);
await sharp(playBuf).png().toFile(playStoreOut);
console.log(`[gen-icons] BONUS: ${playStoreOut} (512x512 Play Store)`);
total++;

console.log('================================================');
console.log(`[gen-icons] DONE - ${total} files generated`);
console.log('================================================');
