import type { AppData, AchievementUnlock } from './types';
import { bestStreak } from './streaks';
import { dateKey } from './dates';
import { isExpectedToday, expectedDaysInMonth } from './frequency';

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_habit', emoji: '🌱', title: 'Primer paso', description: 'Creaste tu primer hábito' },
  { id: 'first_check', emoji: '✓', title: 'Empezaste', description: 'Marcaste tu primer hábito completado' },
  { id: 'streak_3', emoji: '🔥', title: 'En llamas', description: 'Racha de 3 días en algún hábito' },
  { id: 'streak_7', emoji: '⚡', title: 'Una semana', description: 'Racha de 7 días en algún hábito' },
  { id: 'streak_14', emoji: '💎', title: 'Quincena', description: 'Racha de 14 días en algún hábito' },
  { id: 'streak_30', emoji: '🏆', title: 'Un mes', description: 'Racha de 30 días en algún hábito' },
  { id: 'streak_66', emoji: '🌳', title: 'Hábito formado', description: '66 días — la ciencia (Lally, UCL) dice que ya es parte de vos' },
  { id: 'streak_100', emoji: '👑', title: 'Centenario', description: 'Racha de 100 días en algún hábito' },
  { id: 'monthly_goal', emoji: '🎯', title: 'Meta cumplida', description: 'Cumpliste la meta mensual de un hábito' },
  { id: 'perfect_day', emoji: '🌟', title: 'Día perfecto', description: 'Completaste todos los hábitos del día' },
  { id: 'five_habits', emoji: '🚀', title: 'Constructor', description: 'Tenés 5 hábitos activos' },
];

export function evaluate(data: AppData, today: Date = new Date()): string[] {
  const unlocked: string[] = [];
  const have = new Set(data.achievements.map(a => a.id));

  if (data.habits.length >= 1 && !have.has('first_habit')) unlocked.push('first_habit');
  if (data.habits.length >= 5 && !have.has('five_habits')) unlocked.push('five_habits');

  let anyChecked = false;
  for (const day of Object.values(data.completions)) {
    for (const e of Object.values(day)) {
      if (e.done) { anyChecked = true; break; }
    }
    if (anyChecked) break;
  }
  if (anyChecked && !have.has('first_check')) unlocked.push('first_check');

  let bestEver = 0;
  for (const h of data.habits) {
    bestEver = Math.max(bestEver, bestStreak(h, data.completions, today));
  }
  if (bestEver >= 3 && !have.has('streak_3')) unlocked.push('streak_3');
  if (bestEver >= 7 && !have.has('streak_7')) unlocked.push('streak_7');
  if (bestEver >= 14 && !have.has('streak_14')) unlocked.push('streak_14');
  if (bestEver >= 30 && !have.has('streak_30')) unlocked.push('streak_30');
  if (bestEver >= 66 && !have.has('streak_66')) unlocked.push('streak_66');
  if (bestEver >= 100 && !have.has('streak_100')) unlocked.push('streak_100');

  for (const h of data.habits) {
    const m = countMonthDone(data, h.id, today);
    if (m >= h.monthlyGoal && !have.has('monthly_goal')) {
      unlocked.push('monthly_goal');
      break;
    }
  }

  if (!have.has('perfect_day')) {
    for (const dateStr of Object.keys(data.completions)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (date > today) continue;
      const expected = data.habits.filter(h => isExpectedToday(h, date, data.completions));
      if (expected.length === 0) continue;
      const allDone = expected.every(h => data.completions[dateStr]?.[h.id]?.done);
      if (allDone) { unlocked.push('perfect_day'); break; }
    }
  }

  return unlocked;
}

function countMonthDone(data: AppData, habitId: string, anchor: Date): number {
  const y = anchor.getFullYear(), m = anchor.getMonth();
  let n = 0;
  for (const [k, day] of Object.entries(data.completions)) {
    if (!day[habitId]?.done) continue;
    const [yy, mm] = k.split('-').map(Number);
    if (yy === y && mm - 1 === m) n++;
  }
  return n;
}

export function asUnlocks(ids: string[]): AchievementUnlock[] {
  const now = new Date().toISOString();
  return ids.map(id => ({ id, unlockedAt: now }));
}

void dateKey; void expectedDaysInMonth;
