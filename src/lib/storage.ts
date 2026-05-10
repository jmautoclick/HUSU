import type { AppData, Completions } from './types';

const KEY = 'husu-habits-data-v1';

const DEFAULT_DATA: AppData = {
  schemaVersion: 2,
  habits: [],
  completions: {},
  achievements: [],
  onboardingCompleted: false,
  theme: 'dark',
  lastMilestoneShown: {},
  freezesRemaining: 2,
  freezesResetMonth: monthKey(new Date()),
  freezesUsed: {},
};

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_DATA };
    return migrate(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function migrate(raw: any): AppData {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DATA };
  const version = raw.schemaVersion ?? 1;
  let data = raw;
  if (version < 2) data = migrateV1ToV2(data);
  const today = new Date();
  const thisMonth = monthKey(today);
  let freezesRemaining = data.freezesRemaining ?? 2;
  let freezesResetMonth = data.freezesResetMonth ?? thisMonth;
  if (freezesResetMonth !== thisMonth) {
    freezesRemaining = 2;
    freezesResetMonth = thisMonth;
  }
  return {
    ...DEFAULT_DATA,
    ...data,
    schemaVersion: 2,
    achievements: data.achievements ?? [],
    lastMilestoneShown: data.lastMilestoneShown ?? {},
    theme: data.theme ?? 'dark',
    onboardingCompleted: data.onboardingCompleted ?? (data.habits?.length > 0),
    freezesRemaining,
    freezesResetMonth,
    freezesUsed: data.freezesUsed ?? {},
  };
}

function migrateV1ToV2(raw: any): any {
  const habits = (raw.habits ?? []).map((h: any) => ({
    ...h,
    frequency: h.frequency ?? { type: 'daily' },
  }));
  const completions: Completions = {};
  for (const [date, day] of Object.entries(raw.completions ?? {})) {
    const newDay: Record<string, any> = {};
    for (const [habitId, val] of Object.entries(day as Record<string, any>)) {
      if (typeof val === 'boolean') newDay[habitId] = { done: val };
      else if (val && typeof val === 'object' && 'done' in val) newDay[habitId] = val;
      else newDay[habitId] = { done: !!val };
    }
    completions[date] = newDay;
  }
  return { ...raw, habits, completions };
}
