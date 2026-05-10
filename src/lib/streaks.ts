import type { Habit, Completions, AppData } from './types';
import { dateKey } from './dates';
import { isExpectedToday } from './frequency';

const MILESTONES = [3, 7, 14, 30, 66, 100, 365];

export function currentStreak(habit: Habit, completions: Completions, today: Date = new Date(), freezesUsed: Record<string, Record<string, true>> = {}): number {
  let streak = 0;
  const cursor = new Date(today);
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
