#!/usr/bin/env node
// Pre-install hook EAS. Corre ANTES de `npm install` en el server EAS.
// node_modules NO está disponible — solo built-ins de Node.

import { existsSync, lstatSync, readlinkSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const platform = process.env.EAS_BUILD_PLATFORM || 'unknown';
const profile = process.env.EAS_BUILD_PROFILE || 'unknown';

console.log('================================================');
console.log('[eas-pre-install] Husu Habits');
console.log(`[eas-pre-install] platform: ${platform}`);
console.log(`[eas-pre-install] profile:  ${profile}`);
console.log(`[eas-pre-install] node:     ${process.version}`);
console.log(`[eas-pre-install] os:       ${process.platform} ${process.arch}`);
console.log('================================================');

// Solo si es build de iOS: crear symlink para que eas-cli/Xcode encuentre el .xcodeproj
// donde Capacitor lo pone (ios/App/App.xcodeproj) bajo el nombre que EAS espera (ios/*.xcodeproj).
if (platform === 'ios') {
  console.log('[eas-pre-install] iOS detected — setting up xcodeproj symlink');
  const target = 'App/App.xcodeproj';
  const linkPath = resolve('ios', 'App.xcodeproj');

  const realTarget = resolve('ios', target);
  if (!existsSync(realTarget)) {
    console.warn(`[eas-pre-install] WARN: target ${realTarget} doesn't exist yet — symlink may be broken`);
  }

  // Limpieza idempotente: intentar borrar lo que haya en linkPath (símbolo, dir, etc)
  // ignorando errores de "no existe" o "permission denied" en Windows.
  for (const fn of [
    () => unlinkSync(linkPath),
    () => rmSync(linkPath, { recursive: true, force: true }),
  ]) {
    try { fn(); break; } catch {}
  }

  try {
    symlinkSync(target, linkPath, 'dir');
    console.log(`[eas-pre-install] symlink OK: ios/App.xcodeproj -> ${target}`);
  } catch (e) {
    // Si EEXIST (Windows raro con readlink fallido), chequeamos que apunte al
    // target correcto via readlinkSync — si sí, OK, continuamos.
    if (e.code === 'EEXIST') {
      try {
        const current = readlinkSync(linkPath);
        const normalized = current.replace(/\\/g, '/');
        if (normalized === target || normalized.endsWith(target)) {
          console.log(`[eas-pre-install] symlink already exists with correct target (${current})`);
        } else {
          console.warn(`[eas-pre-install] WARN: symlink exists but target is "${current}" (expected "${target}")`);
        }
      } catch {
        console.warn('[eas-pre-install] WARN: linkPath exists but cannot read — continuing anyway');
      }
    } else {
      console.error('[eas-pre-install] symlink FAILED:', e.message);
      process.exit(1);
    }
  }
  // Removemos el import suelto sin uso si quedo
  void lstatSync;
} else {
  console.log(`[eas-pre-install] Skip iOS prep (platform=${platform})`);
}

console.log('[eas-pre-install] DONE ✓');
