import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { AppData } from './types';

export function exportToJSON(data: AppData): string {
  return JSON.stringify({
    app: 'husu-habits',
    exportedAt: new Date().toISOString(),
    data: { ...data, geminiKey: undefined },
  }, null, 2);
}

export async function downloadBackup(data: AppData): Promise<void> {
  const json = exportToJSON(data);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `husu-habits-backup-${stamp}.json`;

  if (Capacitor.isNativePlatform()) {
    // iOS/Android: write to Cache, then trigger native Share sheet
    const result = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    try {
      await Share.share({
        title: 'Husu Habits — Backup',
        text: 'Tus hábitos exportados (JSON).',
        url: result.uri,
        dialogTitle: 'Guardar backup',
      });
    } catch (e) {
      if ((e as Error).message?.toLowerCase().includes('cancel')) return;
      console.warn('Share failed, file saved at:', result.uri);
    }
    return;
  }

  // Web fallback
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    const candidate = parsed?.data ?? parsed;
    if (!candidate || !Array.isArray(candidate.habits)) return null;
    return candidate as AppData;
  } catch {
    return null;
  }
}

export function pickFile(): Promise<string | null> {
  // <input type=file> works in iOS WKWebView for application/json (no permissions needed,
  // user picks file via system Files app picker). On native we could swap to a custom flow
  // but this is good enough — both platforms handle it.
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
