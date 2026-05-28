/* eslint-disable */
// Test funcional de la lógica core de Husu Habits.
// Corre con: npx tsx scripts/audit-logic.test.mts
// NO es parte del build — es una herramienta de auditoría para verificar
// que la lógica de negocio (rachas, frecuencias, logros, fechas) da
// resultados CORRECTOS, no solo que compila.

import { currentStreak, bestStreak, autoApplyFreezes, currentStreakWeeks, bestStreakWeeks } from '../src/lib/streaks.ts';
import { isExpectedToday, countCompletionsThisWeek, expectedDaysInMonth } from '../src/lib/frequency.ts';
import { evaluate } from '../src/lib/achievements.ts';
import { dateKey, parseDateKey, monthDays, daysInMonth } from '../src/lib/dates.ts';
import type { AppData, Habit, Completions } from '../src/lib/types.ts';

let pass = 0, fail = 0;
const fails: string[] = [];
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log(`  ✓ ${name}  (=${JSON.stringify(got)})`); }
  else { fail++; fails.push(name); console.log(`  ✗ ${name}  GOT ${JSON.stringify(got)}  WANT ${JSON.stringify(want)}`); }
}

// Helpers para construir datos sintéticos
function daysAgo(n: number, base = new Date(2026, 4, 28, 14, 30)): Date {
  const d = new Date(base); d.setDate(d.getDate() - n); return d;
}
function mkHabit(over: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Test', colorIdx: 0, createdAt: dateKey(daysAgo(60)), monthlyGoal: 20, frequency: { type: 'daily' }, ...over };
}
function doneOn(habitId: string, dates: Date[]): Completions {
  const c: Completions = {};
  for (const d of dates) { c[dateKey(d)] = { ...(c[dateKey(d)] ?? {}), [habitId]: { done: true } }; }
  return c;
}

const TODAY = new Date(2026, 4, 28, 14, 30); // 28 may 2026, 14:30 (con hora del día!)

console.log('\n=== currentStreak ===');
{
  // 5 días consecutivos hechos INCLUYENDO hoy → racha 5
  const h = mkHabit();
  const comp = doneOn(h.id, [daysAgo(0,TODAY), daysAgo(1,TODAY), daysAgo(2,TODAY), daysAgo(3,TODAY), daysAgo(4,TODAY)]);
  check('5 días seguidos incl. hoy', currentStreak(h, comp, TODAY), 5);
}
{
  // 4 días hechos hasta AYER, hoy todavía NO hecho (son las 14:30) → racha debería ser 4
  // (el día no terminó, no debería romper la racha). Este es el caso del bug sospechado.
  const h = mkHabit();
  const comp = doneOn(h.id, [daysAgo(1,TODAY), daysAgo(2,TODAY), daysAgo(3,TODAY), daysAgo(4,TODAY)]);
  check('4 hasta ayer, hoy pendiente → 4 (BUG si da 0)', currentStreak(h, comp, TODAY), 4);
}
{
  // Gap: hechos hoy, ayer, NO anteayer, sí antes → racha 2 (hoy+ayer)
  const h = mkHabit();
  const comp = doneOn(h.id, [daysAgo(0,TODAY), daysAgo(1,TODAY), daysAgo(3,TODAY), daysAgo(4,TODAY)]);
  check('gap en día -2 → racha 2', currentStreak(h, comp, TODAY), 2);
}
{
  // Freeze: hechos -1..-4, anteayer (-2) NO hecho pero congelado → racha sigue
  const h = mkHabit();
  const comp = doneOn(h.id, [daysAgo(0,TODAY), daysAgo(1,TODAY), daysAgo(3,TODAY), daysAgo(4,TODAY)]);
  const fz = { [dateKey(daysAgo(2,TODAY))]: { [h.id]: true as const } };
  // El freeze bridguea el gap (sin freeze daría 2) pero por diseño el día
  // congelado NO suma +1 — solo evita el corte. Done en 0,1,3,4 = 4.
  check('freeze en -2 bridgea (4 hechos, no rompe)', currentStreak(h, comp, TODAY, fz), 4);
}

console.log('\n=== currentStreakWeeks (racha weekly en semanas) ===');
{
  // TODAY = jue 28-may-2026. Semanas Dom-Sáb. Semana actual: 24..30 may.
  const wk = mkHabit({ frequency: { type: 'weekly', timesPerWeek: 2 }, createdAt: '2026-04-20' });
  // 2x en cada una de: esta sem (25,26), -1 (18,19), -2 (11,12), -3 (4,5) = 4 sem
  const perfect4 = doneOn(wk.id, [
    new Date(2026,4,25), new Date(2026,4,26),
    new Date(2026,4,18), new Date(2026,4,19),
    new Date(2026,4,11), new Date(2026,4,12),
    new Date(2026,4,4),  new Date(2026,4,5),
  ]);
  check('weekly 2x perfecto 4 sem → 4 semanas', currentStreakWeeks(wk, perfect4, TODAY), 4);

  // Semana en curso con solo 1 hecho (aún no llega a 2) + 3 sem previas OK → 3
  const inProgress = doneOn(wk.id, [
    new Date(2026,4,25),
    new Date(2026,4,18), new Date(2026,4,19),
    new Date(2026,4,11), new Date(2026,4,12),
    new Date(2026,4,4),  new Date(2026,4,5),
  ]);
  check('weekly: semana en curso 1/2 no rompe → 3 sem previas', currentStreakWeeks(wk, inProgress, TODAY), 3);

  // Semana -2 perdida (0) → racha corta a 2 (esta + -1)
  const missed = doneOn(wk.id, [
    new Date(2026,4,25), new Date(2026,4,26),
    new Date(2026,4,18), new Date(2026,4,19),
    // -2 vacía
    new Date(2026,4,4),  new Date(2026,4,5),
  ]);
  check('weekly: semana -2 perdida → racha 2', currentStreakWeeks(wk, missed, TODAY), 2);

  // bestStreakWeeks: 4 perfectas → mejor 4; con -2 perdida → mejor run 2
  check('bestStreakWeeks 4 perfectas → 4', bestStreakWeeks(wk, perfect4, TODAY), 4);
  check('bestStreakWeeks con -2 perdida → 2', bestStreakWeeks(wk, missed, TODAY), 2);
}

console.log('\n=== bestStreak ===');
{
  const h = mkHabit({ createdAt: dateKey(daysAgo(10,TODAY)) });
  // hechos -9..-5 (5 seguidos), gap, -2..-0 (3 seguidos) → best 5
  const comp = doneOn(h.id, [daysAgo(9,TODAY),daysAgo(8,TODAY),daysAgo(7,TODAY),daysAgo(6,TODAY),daysAgo(5,TODAY), daysAgo(2,TODAY),daysAgo(1,TODAY),daysAgo(0,TODAY)]);
  check('best streak con dos rachas → 5', bestStreak(h, comp, TODAY), 5);
}

console.log('\n=== isExpectedToday ===');
{
  const daily = mkHabit({ frequency: { type: 'daily' } });
  check('daily siempre esperado', isExpectedToday(daily, TODAY, {}), true);
  // 28 may 2026 es jueves (getDay 4)
  const spec = mkHabit({ frequency: { type: 'specific', weekdays: [1,3,5] } }); // L,X,V
  check('specific jueves NO esperado', isExpectedToday(spec, TODAY, {}), false);
  const spec2 = mkHabit({ frequency: { type: 'specific', weekdays: [4] } }); // jueves
  check('specific jueves SÍ esperado', isExpectedToday(spec2, TODAY, {}), true);
}
{
  // weekly 3x: si ya hizo 3 esta semana, no esperado
  const wk = mkHabit({ frequency: { type: 'weekly', timesPerWeek: 3 } });
  // semana de TODAY (jue 28): domingo 24..sáb 30. Hechos lun25, mar26, mié27 = 3
  const comp = doneOn(wk.id, [new Date(2026,4,25), new Date(2026,4,26), new Date(2026,4,27)]);
  check('weekly 3x ya cumplido → no esperado', isExpectedToday(wk, TODAY, comp), false);
  const comp2 = doneOn(wk.id, [new Date(2026,4,25), new Date(2026,4,26)]);
  check('weekly 3x con 2 hechos → sí esperado', isExpectedToday(wk, TODAY, comp2), true);
}

console.log('\n=== fechas / edge cases ===');
{
  check('dateKey round-trip', dateKey(parseDateKey('2026-02-09')), '2026-02-09');
  check('feb 2024 bisiesto = 29 días', daysInMonth(new Date(2024,1,15)), 29);
  check('feb 2026 no bisiesto = 28 días', daysInMonth(new Date(2026,1,15)), 28);
  check('monthDays abril = 30', monthDays(2026, 3).length, 30);
  check('expectedDaysInMonth daily mayo = 31', expectedDaysInMonth({type:'daily'}, 2026, 4), 31);
}

console.log('\n=== achievements ===');
{
  const h = mkHabit({ createdAt: dateKey(daysAgo(10,TODAY)) });
  const comp = doneOn(h.id, [daysAgo(2,TODAY),daysAgo(1,TODAY),daysAgo(0,TODAY)]); // 3 seguidos
  const data: AppData = {
    schemaVersion: 2, habits: [h], completions: comp, achievements: [],
    onboardingCompleted: true, theme: 'dark', lastMilestoneShown: {},
    freezesRemaining: 2, freezesResetMonth: '2026-05', freezesUsed: {},
  };
  const got = evaluate(data, TODAY).sort();
  // Con 1 hábito, cada día hecho ES un "día perfecto" (todos los esperados
  // cumplidos), así que perfect_day también desbloquea. Correcto.
  check('logros: first_check+first_habit+perfect_day+streak_3', got, ['first_check','first_habit','perfect_day','streak_3']);
}

console.log(`\n========== RESULTADO: ${pass} PASS, ${fail} FAIL ==========`);
if (fail > 0) { console.log('FALLARON:', fails.join(', ')); }
