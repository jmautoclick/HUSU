import type { Habit, Completions, AppData } from './types';
import { dateKey } from './dates';
import { isExpectedToday } from './frequency';

const MILESTONES = [3, 7, 14, 30, 66, 100, 365];

export function currentStreak(habit: Habit, completions: Completions, today: Date = new Date(), freezesUsed: Record<string, Record<string, true>> = {}): number {
  let streak = 0;
  // IMPORTANTE: stripear la hora del día. Antes era `new Date(today)` que
  // mantenía la hora actual (ej 14:30), y la comparación de abajo
  // `cursor.getTime() === stripTime(today).getTime()` (medianoche) NUNCA
  // daba true en la iteración 0 → la rama "hoy no terminó, no rompas la
  // racha" no corría → si no marcabas el hábito HOY todavía, la racha
  // mostraba 0 en vez de N. Bug confirmado con test funcional.
  const cursor = stripTime(today);
  let safety = 1000;
  while (safety-- > 0) {
    const k = dateKey(cursor);
    const expected = isExpectedToday(habit, cursor, completions);
    const done = !!completions[k]?.[habit.id]?.done;
    const frozen = !!freezesUsed[k]?.[habit.id];
    if (expected) {
      if (done) {
        streak++;
      } else if (frozen) {
        // protected by freeze, doesn't count toward streak but doesn't break it
      } else {
        if (cursor.getTime() === stripTime(today).getTime() && !done) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getTime() < stripTime(new Date(habit.createdAt)).getTime()) break;
  }
  return streak;
}

export function bestStreak(habit: Habit, completions: Completions, today: Date = new Date()): number {
  const start = stripTime(new Date(habit.createdAt));
  const end = stripTime(today);
  let best = 0;
  let run = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const expected = isExpectedToday(habit, d, completions);
    const done = !!completions[dateKey(d)]?.[habit.id]?.done;
    if (!expected) continue;
    if (done) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

function startOfWeekLocal(d: Date): Date {
  const out = stripTime(d);
  out.setDate(out.getDate() - out.getDay()); // domingo
  return out;
}

// Racha en SEMANAS para hábitos weekly: semanas consecutivas (Dom-Sáb)
// cumpliendo timesPerWeek. La semana EN CURSO no rompe si todavía no llegó
// a la meta (hay tiempo). Para daily/specific la racha es en días
// (currentStreak). Sin esto, un hábito 2x/sem perfecto 4 semanas mostraba
// racha "1" (la racha por-día no aplica a hábitos semanales).
export function currentStreakWeeks(habit: Habit, completions: Completions, today: Date = new Date()): number {
  if (habit.frequency.type !== 'weekly') return 0;
  const goal = habit.frequency.timesPerWeek;
  const created = stripTime(new Date(habit.createdAt));
  const thisWeekStart = startOfWeekLocal(today);
  let weeks = 0;
  const cursor = new Date(thisWeekStart);
  let safety = 600;
  while (safety-- > 0) {
    const weekEnd = new Date(cursor); weekEnd.setDate(cursor.getDate() + 6);
    if (weekEnd < created) break; // semana entera previa a la creación del hábito
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor); d.setDate(cursor.getDate() + i);
      if (d > today) break;
      if (completions[dateKey(d)]?.[habit.id]?.done) done++;
    }
    const isCurrentWeek = cursor.getTime() === thisWeekStart.getTime();
    if (done >= goal) weeks++;
    else if (isCurrentWeek) { /* semana en curso: no rompe ni suma */ }
    else break;
    cursor.setDate(cursor.getDate() - 7);
  }
  return weeks;
}

// Mejor racha histórica en SEMANAS para hábitos weekly (el run más largo de
// semanas consecutivas cumpliendo la meta). Para daily/specific usar bestStreak.
export function bestStreakWeeks(habit: Habit, completions: Completions, today: Date = new Date()): number {
  if (habit.frequency.type !== 'weekly') return 0;
  const goal = habit.frequency.timesPerWeek;
  const thisWeekStart = startOfWeekLocal(today);
  const cursor = startOfWeekLocal(stripTime(new Date(habit.createdAt)));
  let best = 0, run = 0, safety = 600;
  while (cursor <= thisWeekStart && safety-- > 0) {
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor); d.setDate(cursor.getDate() + i);
      if (d > today) break;
      if (completions[dateKey(d)]?.[habit.id]?.done) done++;
    }
    const isCurrentWeek = cursor.getTime() === thisWeekStart.getTime();
    if (done >= goal) { run++; if (run > best) best = run; }
    else if (!isCurrentWeek) run = 0; // semana en curso incompleta no corta el "best"
    cursor.setDate(cursor.getDate() + 7);
  }
  return best;
}

// Display unificado: devuelve valor + unidad correcta según el tipo de hábito.
// daily/specific → días; weekly → semanas. Usar para badges y respuestas del Coach.
export function streakDisplay(
  habit: Habit, completions: Completions, today: Date = new Date(),
  freezesUsed: Record<string, Record<string, true>> = {},
): { value: number; unit: 'día' | 'días' | 'sem' } {
  if (habit.frequency.type === 'weekly') {
    return { value: currentStreakWeeks(habit, completions, today), unit: 'sem' };
  }
  const v = currentStreak(habit, completions, today, freezesUsed);
  return { value: v, unit: v === 1 ? 'día' : 'días' };
}

// Idem para la MEJOR racha histórica (semanas si weekly, días si no).
export function bestStreakDisplay(
  habit: Habit, completions: Completions, today: Date = new Date(),
): { value: number; unit: 'día' | 'días' | 'sem' } {
  if (habit.frequency.type === 'weekly') {
    return { value: bestStreakWeeks(habit, completions, today), unit: 'sem' };
  }
  const v = bestStreak(habit, completions, today);
  return { value: v, unit: v === 1 ? 'día' : 'días' };
}

export function nextMilestone(streak: number): number | null {
  for (const m of MILESTONES) if (streak < m) return m;
  return null;
}

export function isMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}

export interface FreezeApplication {
  habitId: string;
  date: string;
  habitName: string;
}

export function autoApplyFreezes(data: AppData, today: Date = new Date()): { applications: FreezeApplication[]; newData: AppData } {
  if (data.freezesRemaining <= 0) return { applications: [], newData: data };

  const applications: FreezeApplication[] = [];
  let remaining = data.freezesRemaining;
  const freezesUsed = JSON.parse(JSON.stringify(data.freezesUsed)) as AppData['freezesUsed'];

  for (const habit of data.habits) {
    if (remaining <= 0) break;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yKey = dateKey(yesterday);
    if (!isExpectedToday(habit, yesterday, data.completions)) continue;
    const wasDone = !!data.completions[yKey]?.[habit.id]?.done;
    if (wasDone) continue;
    const alreadyFrozen = !!freezesUsed[yKey]?.[habit.id];
    if (alreadyFrozen) continue;

    const tempFreezes = freezesUsed;
    const streakIfFrozen = currentStreak(habit, data.completions, today, {
      ...tempFreezes,
      [yKey]: { ...(tempFreezes[yKey] ?? {}), [habit.id]: true },
    });
    if (streakIfFrozen < 3) continue;

    if (!freezesUsed[yKey]) freezesUsed[yKey] = {};
    freezesUsed[yKey][habit.id] = true;
    remaining--;
    applications.push({ habitId: habit.id, date: yKey, habitName: habit.name });
  }

  if (applications.length === 0) return { applications: [], newData: data };

  return {
    applications,
    newData: { ...data, freezesUsed, freezesRemaining: remaining },
  };
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
