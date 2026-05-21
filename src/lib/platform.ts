import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const CLAY_DARK_BG = '#2A2823';
const CREAM_LIGHT_BG = '#F5EFE6';

export async function applyStatusBarTheme(theme: 'dark' | 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    // Android-only: backgroundColor (iOS ignora silenciosamente)
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: theme === 'dark' ? CLAY_DARK_BG : CREAM_LIGHT_BG });
    }
  } catch {
    // Plugin no disponible (web preview) o user lo bloqueó — silencioso
  }
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function platformName(): 'ios' | 'android' | 'web' {
  const p = Capacitor.getPlatform();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
}
