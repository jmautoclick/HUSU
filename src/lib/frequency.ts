import type { Frequency, Habit, Completions } from './types';
import { dateKey } from './dates';

export function describeFrequency(freq: Frequency): string {
  switch (freq.type) {
    case 'daily': return 'Todos los días';
    case 'weekly': return `${freq.timesPerWeek}x por semana`;
    case 'specific': {
      const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const sorted = [...freq.weekdays].sort((a, b) => a - b);
      return sorted.map(i => labels[i]).join(' · ');
    }
  }
}

export function isExpectedToday(habit: Habit, date: Date, completions: Completions): boolean {
  const f = habit.frequency;
  if (f.type === 'daily') return true;
  if (f.type === 'specific') return f.weekdays.includes(date.getDay());
  if (f.type === 'weekly') {
    const doneThisWeek = countCompletionsThisWeek(habit.id, date, completions);
    if (doneThisWeek >= f.timesPerWeek) return false;
    return true;
  }
  return true;
}

export function countCompletionsThisWeek(habitId: string, anchor: Date, completions: Completions): number {
  const start = startOfWeek(anchor);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > anchor) break;
    if (completions[dateKey(d)]?.[habitId]?.done) n++;
  }
  return n;
}

export function expectedDaysInMonth(freq: Frequency, year: number, month: number): number {
  if (freq.type === 'daily') return new Date(year, month + 1, 0).getDate();
  if (freq.type === 'weekly') {
    const days = new Date(year, month + 1, 0).getDate();
    return Math.round((freq.timesPerWeek / 7) * days);
  }
  if (freq.type === 'specific') {
    const days = new Date(year, month + 1, 0).getDate();
    let n = 0;
    for (let day = 1; day <= days; day++) {
      const d = new Date(year, month, day);
      if (freq.weekdays.includes(d.getDay())) n++;
    }
    return n;
  }
  return 0;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setDate(d.getDate() - d.getDay());
  out.setHours(0, 0, 0, 0);
  return out;
}
