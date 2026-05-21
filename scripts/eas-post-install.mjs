#!/usr/bin/env node
// Post-install hook EAS. Corre DESPUÉS de `npm install` en el server EAS,
// pero ANTES del build nativo (xcodebuild / gradle).
//
// Steps:
// 1. npm run build (Vite -> dist/)
// 2. npx cap sync <platform> (copia dist a ios/App/App/public o android/.../assets/public)
// 3. fix-spm-paths (solo si iOS, normaliza backslashes Windows en Package.swift)

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const platform = process.env.EAS_BUILD_PLATFORM || 'unknown';
const profile = process.env.EAS_BUILD_PROFILE || 'unknown';

console.log('================================================');
console.log('[eas-post-install] Husu Habits');
console.log(`[eas-post-install] platform: ${platform}`);
console.log(`[eas-post-install] profile:  ${profile}`);
console.log(`[eas-post-install] cwd:      ${process.cwd()}`);
console.log('================================================');

function step(name, cmd) {
  console.log(`\n[eas-post-install] --- ${name} ---`);
  console.log(`[eas-post-install] $ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[eas-post-install] ✓ ${name} OK`);
  } catch (e) {
    console.error(`[eas-post-install] ✗ ${name} FAILED`);
    console.error(`[eas-post-install]   exit code: ${e.status}`);
    console.error(`[eas-post-install]   command:   ${cmd}`);
    throw e;
  }
}

try {
  // 1. Build web assets
  step('Build web assets (Vite)', 'npm run build');

  // 2. Capacitor sync — solo el platform actual
  if (platform === 'ios') {
    step('Capacitor sync iOS', 'npx cap sync ios');
  } else if (platform === 'android') {
    step('Capacitor sync Android', 'npx cap sync android');
  } else {
    console.warn(`[eas-post-install] WARN: platform unknown (${platform}) — syncing all`);
    step('Capacitor sync all', 'npx cap sync');
  }

  // 3. Fix SPM paths (solo iOS)
  if (platform === 'ios') {
    if (existsSync('ios/App/CapApp-SPM/Package.swift')) {
      step('Fix SPM paths', 'node scripts/fix-spm-paths.mjs');
    } else {
      console.log('[eas-post-install] No Package.swift, skipping SPM fix');
    }
  }

  console.log('\n[eas-post-install] DONE ✓✓✓');
} catch (e) {
  console.error('\n[eas-post-install] BUILD FAILED');
  process.exit(1);
}
