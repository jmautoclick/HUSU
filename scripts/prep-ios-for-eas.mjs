#!/usr/bin/env node
// eas-cli hardcoded para buscar el .xcodeproj en `ios/*.xcodeproj` (1 nivel),
// pero Capacitor pone el proyecto en `ios/App/App.xcodeproj` (2 niveles).
// Creamos un symlink temporal `ios/App.xcodeproj` -> `ios/App/App.xcodeproj`
// para que eas-cli encuentre el scheme correctamente.
//
// Symlinks preservan paths relativos del pbxproj, así que xcodebuild
// resuelve las referencias internas correctamente.

import { existsSync, lstatSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const target = 'App/App.xcodeproj';
const linkPath = resolve('ios', 'App.xcodeproj');

if (existsSync(linkPath)) {
  // si ya hay symlink/dir, removerlo para forzar recreación limpia
  try {
    rmSync(linkPath, { recursive: true, force: true });
  } catch (e) {
    console.warn('[prep-ios] no pude limpiar existing:', e.message);
  }
}

try {
  // 'dir' funciona en Windows (junction); en Linux/macOS es symlink standard
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  symlinkSync(target, linkPath, type);
  console.log(`[prep-ios] symlink creado: ios/App.xcodeproj -> ${target}`);
} catch (e) {
  console.error('[prep-ios] symlink falló:', e.message);
  console.error('[prep-ios] Si estás en Windows sin admin, ejecutá con privilegios elevados');
  console.error('[prep-ios] o desde WSL (donde symlinks funcionan sin elevación)');
  process.exit(1);
}
