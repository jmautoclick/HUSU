#!/usr/bin/env node
// EAS asume la estructura Expo: proyecto en ios/ y el Info.plist del target en
// ios/<target>/Info.plist. Capacitor anida todo en ios/App/ (proyecto en
// ios/App/App.xcodeproj, Info.plist en ios/App/App/Info.plist). Eso hace que
// eas-cli no encuentre el scheme y que el paso "Configure Xcode project"
// busque el Info.plist en ios/App/Info.plist (y falle con ENOENT).
//
// Creamos symlinks temporales a nivel ios/ con exactamente lo que EAS espera:
//   ios/App.xcodeproj   -> App/App.xcodeproj   (scheme detection de eas-cli)
//   ios/App/Info.plist  -> App/Info.plist      (paso Configure Xcode project)
// Son gitignored. xcodebuild usa los paths reales internos del pbxproj, así que
// no interfieren con el build real.

import { rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const isWin = process.platform === 'win32';

const links = [
  { target: 'App/App.xcodeproj', link: resolve('ios', 'App.xcodeproj'), kind: 'dir' },
  { target: 'App/Info.plist', link: resolve('ios', 'App', 'Info.plist'), kind: 'file' },
];

for (const { target, link, kind } of links) {
  // Cleanup idempotente: borrar lo que haya (symlink/junction/dir/file), ignorando
  // errores. Más robusto que existsSync (que sigue symlinks rotos y puede mentir).
  for (const fn of [() => unlinkSync(link), () => rmSync(link, { recursive: true, force: true })]) {
    try { fn(); break; } catch { /* siguiente método */ }
  }
  try {
    // En Windows: 'junction' para dirs (no necesita admin), 'file' para files
    // (sí necesita admin → mejor correr desde WSL). En Linux/macOS: 'dir'/'file'.
    const type = isWin ? (kind === 'dir' ? 'junction' : 'file') : kind;
    symlinkSync(target, link, type);
    console.log(`[prep-ios] symlink: ${link} -> ${target}`);
  } catch (e) {
    console.error(`[prep-ios] symlink falló (${link}):`, e.message);
    if (isWin) console.error('[prep-ios] En Windows los file-symlinks necesitan admin; corré desde WSL.');
    process.exit(1);
  }
}
