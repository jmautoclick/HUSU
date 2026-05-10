import type { AppData, Habit } from './types';
import { dateKey } from './dates';
import { isExpectedToday } from './frequency';
import { currentStreak } from './streaks';

export interface WeekRecap {
  weekStart: Date;
  weekEnd: Date;
  totalExpected: number;
  totalDone: number;
  rate: number;
  bestHabit?: { habit: Habit; doneCount: number; expectedCount: number };
  topStreakHabit?: { habit: Habit; streak: number };
  perfectDays: number;
  daysWithActivity: number;
}

export function lastWeekRecap(data: AppData, anchor: Date = new Date()): WeekRecap {
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  let totalExpected = 0;
  let totalDone = 0;
  let perfectDays = 0;
  let daysWithActivity = 0;
  const perHabit: Record<string, { done: number; expected: number }> = {};

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = dateKey(d);
    const day = data.completions[k] ?? {};
    const expectedToday = data.habits.filter(h => isExpectedToday(h, d, data.completions));
    const doneToday = expectedToday.filter(h => day[h.id]?.done).length;
    totalExpected += expectedToday.length;
    totalDone += doneToday;
    if (expectedToday.length > 0 && doneToday === expectedToday.length) perfectDays++;
    if (doneToday > 0) daysWithActivity++;
    for (const h of expectedToday) {
      const e = perHabit[h.id] ?? { done: 0, expected: 0 };
      e.expected++;
      if (day[h.id]?.done) e.done++;
      perHabit[h.id] = e;
    }
  }

  let bestHabit: WeekRecap['bestHabit'];
  let bestRate = -1;
  for (const [id, agg] of Object.entries(perHabit)) {
    if (agg.expected < 2) continue;
    const r = agg.done / agg.expected;
    if (r > bestRate) {
      bestRate = r;
      const habit = data.habits.find(h => h.id === id);
      if (habit) bestHabit = { habit, doneCount: agg.done, expectedCount: agg.expected };
    }
  }

  let topStreakHabit: WeekRecap['topStreakHabit'];
  let bestStreak = 0;
  for (const h of data.habits) {
    const s = currentStreak(h, data.completions, anchor, data.freezesUsed);
    if (s > bestStreak) {
      bestStreak = s;
      topStreakHabit = { habit: h, streak: s };
    }
  }

  return {
    weekStart: start,
    weekEnd: end,
    totalExpected,
    totalDone,
    rate: totalExpected > 0 ? totalDone / totalExpected : 0,
    bestHabit,
    topStreakHabit,
    perfectDays,
    daysWithActivity,
  };
}

export function isSunday(d: Date = new Date()): boolean {
  return d.getDay() === 0;
}
