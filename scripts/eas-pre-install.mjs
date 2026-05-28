#!/usr/bin/env node
// Pre-install hook EAS. Corre ANTES de `npm install` en el server EAS.
// node_modules NO está disponible — solo built-ins de Node.

import { existsSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
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

// EAS asume estructura Expo (ios/<proj>.xcodeproj + ios/<target>/Info.plist),
// pero Capacitor anida en ios/App/. Creamos symlinks a nivel ios/ con lo que
// EAS espera. Corre en el Mac de EAS (darwin), por eso usa tipos 'dir'/'file'
// directos (sin la lógica de junction de Windows).
//   ios/App.xcodeproj  -> App/App.xcodeproj  (scheme detection de eas-cli)
//   ios/App/Info.plist -> App/Info.plist     (paso "Configure Xcode project")
if (platform === 'ios') {
  console.log('[eas-pre-install] iOS detected — setting up EAS-compat symlinks');
  const links = [
    { target: 'App/App.xcodeproj', link: resolve('ios', 'App.xcodeproj'), type: 'dir' },
    { target: 'App/Info.plist', link: resolve('ios', 'App', 'Info.plist'), type: 'file' },
  ];
  for (const { target, link, type } of links) {
    // Limpieza idempotente: borrar lo que haya (symlink/dir/file) antes de recrear.
    for (const fn of [() => unlinkSync(link), () => rmSync(link, { recursive: true, force: true })]) {
      try { fn(); break; } catch {}
    }
    try {
      symlinkSync(target, link, type);
      console.log(`[eas-pre-install] symlink OK: ${link} -> ${target}`);
    } catch (e) {
      console.error(`[eas-pre-install] symlink FAILED (${link}):`, e.message);
      process.exit(1);
    }
  }
} else {
  console.log(`[eas-pre-install] Skip iOS prep (platform=${platform})`);
}

// Fix npm bug con optional deps cross-platform:
// package-lock.json generado en Windows no incluye los bindings nativos
// para Linux (rolldown/vite/sharp) ni para macOS (sharp en builds iOS).
// Borramos el lock en CUALQUIER plataforma que no sea Windows para forzar
// resolución fresca en el server EAS — fetchea los .node correctos para
// el host actual (linux para Android EAS, darwin para iOS EAS).
// Ref: https://github.com/npm/cli/issues/4828
if (existsSync('package-lock.json') && process.platform !== 'win32') {
  try {
    unlinkSync('package-lock.json');
    console.log(`[eas-pre-install] Removed package-lock.json to force cross-platform deps resolution (platform=${process.platform})`);
  } catch (e) {
    console.warn('[eas-pre-install] Could not remove package-lock.json:', e.message);
  }
}

console.log('[eas-pre-install] DONE ✓');
