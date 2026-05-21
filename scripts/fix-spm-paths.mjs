#!/usr/bin/env node
// Capacitor CLI corre en Windows con path.join() de Windows y genera backslashes
// en ios/App/CapApp-SPM/Package.swift. Xcode/SPM en macOS/Linux requieren forward
// slashes. Este script normaliza después de cada `npx cap sync ios`.
//
// Idempotente: si ya está limpio, no toca nada.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '..', 'ios', 'App', 'CapApp-SPM', 'Package.swift');

if (!existsSync(target)) {
  console.log('[fix-spm-paths] no Package.swift found, skipping');
  process.exit(0);
}

const original = readFileSync(target, 'utf-8');
// Reemplaza solo dentro de comillas y solo si hay backslashes claramente WIN-style
const fixed = original.replace(/path:\s*"([^"]+)"/g, (_, p) => {
  const normalized = p.replace(/\\/g, '/');
  return `path: "${normalized}"`;
});

if (fixed === original) {
  console.log('[fix-spm-paths] Package.swift already uses forward slashes ✓');
  process.exit(0);
}

writeFileSync(target, fixed, 'utf-8');
console.log('[fix-spm-paths] normalized Package.swift paths (WIN backslashes → forward slashes)');
