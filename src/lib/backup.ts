import type { AppData } from './types';

export function exportToJSON(data: AppData): string {
  return JSON.stringify({
    app: 'husu-habits',
    exportedAt: new Date().toISOString(),
    data: { ...data, geminiKey: undefined },
  }, null, 2);
}

export function downloadBackup(data: AppData) {
  const json = exportToJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `husu-habits-backup-${stamp}.json`;
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
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
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
