/* eslint-disable */
// Test de integridad de datos: migración v1→v2, corrupción, reset de freezes,
// y recap semanal. Lo más crítico — un bug acá corrompe data real del usuario.
// Corre con: npx tsx scripts/audit-data.test.mts

// Mock de localStorage (storage.ts solo lo toca en runtime, no en import)
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

const { loadData, saveData, monthKey } = await import('../src/lib/storage.ts');
const { lastWeekRecap } = await import('../src/lib/recap.ts');
import type { AppData } from '../src/lib/types.ts';

let pass = 0, fail = 0; const fails: string[] = [];
function ok(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; fails.push(name); console.log(`  ✗ ${name}  ${detail}`); }
}
const KEY = 'husu-habits-data-v1';

console.log('\n=== MIGRACIÓN v1 → v2 (data legacy del amigo / versiones viejas) ===');
{
  // v1: sin schemaVersion, hábitos sin frequency, completions como booleanos
  store[KEY] = JSON.stringify({
    habits: [{ id: 'h1', name: 'Leer', colorIdx: 0, createdAt: '2026-05-01', monthlyGoal: 20 }],
    completions: { '2026-05-10': { h1: true }, '2026-05-11': { h1: false } },
    onboardingCompleted: true,
  });
  const d = loadData();
  ok('schemaVersion → 2', d.schemaVersion === 2, `got ${d.schemaVersion}`);
  ok('hábito sin frequency → daily', d.habits[0]?.frequency?.type === 'daily', JSON.stringify(d.habits[0]?.frequency));
  ok('completion boolean true → {done:true}', d.completions['2026-05-10']?.h1?.done === true);
  ok('completion boolean false → {done:false}', d.completions['2026-05-11']?.h1?.done === false);
  ok('freezes inicializados (2)', d.freezesRemaining === 2, `got ${d.freezesRemaining}`);
  ok('achievements array existe', Array.isArray(d.achievements));
  ok('theme default dark', d.theme === 'dark');
}

console.log('\n=== CORRUPCIÓN / data inválida → default sin crashear ===');
{
  store[KEY] = '{ esto no es json válido <<<';
  let threw = false; let d: AppData | null = null;
  try { d = loadData(); } catch { threw = true; }
  ok('JSON corrupto no crashea → default', !threw && !!d && d.schemaVersion === 2);

  store[KEY] = 'null';
  ok('localStorage "null" → default', loadData().habits.length === 0);

  delete store[KEY];
  ok('sin data → default limpio', loadData().onboardingCompleted === false);
}

console.log('\n=== RESET MENSUAL DE FREEZES ===');
{
  // data v2 con freezesResetMonth viejo → al cargar resetea a 2
  store[KEY] = JSON.stringify({
    schemaVersion: 2, habits: [], completions: {}, achievements: [],
    onboardingCompleted: true, theme: 'dark', lastMilestoneShown: {},
    freezesRemaining: 0, freezesResetMonth: '2020-01', freezesUsed: { '2020-01-05': { h1: true } },
  });
  const d = loadData();
  ok('mes nuevo → freezes reseteados a 2', d.freezesRemaining === 2, `got ${d.freezesRemaining}`);
  ok('freezesResetMonth → mes actual', d.freezesResetMonth === monthKey(new Date()), d.freezesResetMonth);
}
{
  // mismo mes → NO resetea (respeta freezes usados)
  const thisMonth = monthKey(new Date());
  store[KEY] = JSON.stringify({
    schemaVersion: 2, habits: [], completions: {}, achievements: [],
    onboardingCompleted: true, theme: 'dark', lastMilestoneShown: {},
    freezesRemaining: 1, freezesResetMonth: thisMonth, freezesUsed: {},
  });
  ok('mismo mes → mantiene freezesRemaining=1', loadData().freezesRemaining === 1);
}

console.log('\n=== RECAP SEMANAL (lastWeekRecap) ===');
{
  const empty: AppData = {
    schemaVersion: 2, habits: [], completions: {}, achievements: [],
    onboardingCompleted: true, theme: 'dark', lastMilestoneShown: {},
    freezesRemaining: 2, freezesResetMonth: '2026-05', freezesUsed: {},
  };
  const r = lastWeekRecap(empty, new Date(2026, 4, 28));
  ok('recap vacío → totalExpected 0, rate 0', r.totalExpected === 0 && r.rate === 0);

  // 1 hábito daily, hecho 5 de los 7 días de la semana pasada
  const h = { id: 'h1', name: 'Leer', colorIdx: 0, createdAt: '2026-01-01', monthlyGoal: 20, frequency: { type: 'daily' as const } };
  const comp: any = {};
  // semana pasada respecto a jue 28-may: anchor-1=27, start=21..27. Marco 21-25 (5 días)
  for (const day of [21, 22, 23, 24, 25]) comp[`2026-05-${day}`] = { h1: { done: true } };
  const data: AppData = { ...empty, habits: [h], completions: comp };
  const r2 = lastWeekRecap(data, new Date(2026, 4, 28));
  ok('recap: 7 esperados', r2.totalExpected === 7, `got ${r2.totalExpected}`);
  ok('recap: 5 hechos', r2.totalDone === 5, `got ${r2.totalDone}`);
  ok('recap: rate ~71%', Math.round(r2.rate * 100) === 71, `got ${Math.round(r2.rate*100)}`);
}

console.log('\n=== ROUND-TRIP save→load (no pierde data) ===');
{
  const original: AppData = {
    schemaVersion: 2,
    habits: [{ id: 'h1', name: 'Meditar', colorIdx: 2, createdAt: '2026-05-01', monthlyGoal: 25, frequency: { type: 'weekly', timesPerWeek: 3 }, intention: 'estar presente' }],
    completions: { '2026-05-20': { h1: { done: true, note: 'buena sesión' } } },
    achievements: [{ id: 'first_habit', unlockedAt: '2026-05-01T00:00:00Z' }],
    onboardingCompleted: true, theme: 'light', lastMilestoneShown: { h1: 7 },
    identity: 'una persona calma', freezesRemaining: 2, freezesResetMonth: monthKey(new Date()), freezesUsed: {},
  };
  saveData(original);
  const loaded = loadData();
  ok('round-trip: nombre', loaded.habits[0].name === 'Meditar');
  ok('round-trip: frequency weekly preservada', loaded.habits[0].frequency.type === 'weekly');
  ok('round-trip: nota preservada', loaded.completions['2026-05-20'].h1.note === 'buena sesión');
  ok('round-trip: identity', loaded.identity === 'una persona calma');
  ok('round-trip: theme light', loaded.theme === 'light');
}

console.log(`\n========== DATA: ${pass} PASS, ${fail} FAIL ==========`);
if (fail) console.log('FALLARON:\n - ' + fails.join('\n - '));
