import type { AppData, Habit } from './types';
import { dateKey, parseDateKey } from './dates';
import { isExpectedToday } from './frequency';

export interface PatternInsight {
  text: string;
  weight: number;
}

const DOW_LABELS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const DOW_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function detectPatterns(data: AppData, today: Date = new Date()): PatternInsight[] {
  const insights: PatternInsight[] = [];

  for (const h of data.habits) {
    const dow = weakestDayOfWeek(h, data, today);
    if (dow !== null) {
      insights.push({
        text: `Para "${h.name}", los ${DOW_LABELS[dow.day]} cumple solo ${dow.rate}% (vs ${dow.bestRate}% el mejor día).`,
        weight: 3 - dow.rate / 100,
      });
    }
  }

  const corrs = strongCoOccurrences(data, today);
  for (const c of corrs.slice(0, 3)) {
    insights.push({
      text: `Cuando hace "${c.a}", ${c.coDayPct}% de las veces también hace "${c.b}" (correlación fuerte).`,
      weight: c.coDayPct / 100,
    });
  }

  for (const h of data.habits) {
    const w = streakWindow(h, data, 30);
    if (w.before !== null && w.after !== null && w.after - w.before > 0.2) {
      insights.push({
        text: `"${h.name}" mejoró: ${(w.before * 100).toFixed(0)}% → ${(w.after * 100).toFixed(0)}% en los últimos 15 vs 15 días anteriores.`,
        weight: w.after - w.before,
      });
    }
    if (w.before !== null && w.after !== null && w.before - w.after > 0.2) {
      insights.push({
        text: `"${h.name}" cayó: ${(w.before * 100).toFixed(0)}% → ${(w.after * 100).toFixed(0)}% en los últimos 15 vs 15 días anteriores. Probablemente vale revisar la rutina.`,
        weight: w.before - w.after,
      });
    }
  }

  return insights.sort((a, b) => b.weight - a.weight).slice(0, 5);
}

function weakestDayOfWeek(habit: Habit, data: AppData, today: Date) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const start = new Date(habit.createdAt);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (!isExpectedToday(habit, d, data.completions)) continue;
    totals[d.getDay()]++;
    if (data.completions[dateKey(d)]?.[habit.id]?.done) counts[d.getDay()]++;
  }
  const rates = counts.map((c, i) => ({ day: i, rate: totals[i] > 0 ? c / totals[i] : -1, total: totals[i] }));
  const valid = rates.filter(r => r.total >= 4);
  if (valid.length < 2) return null;
  const worst = valid.reduce((min, r) => r.rate < min.rate ? r : min);
  const best = valid.reduce((max, r) => r.rate > max.rate ? r : max);
  if (best.rate - worst.rate < 0.25) return null;
  return { day: worst.day, rate: Math.round(worst.rate * 100), bestRate: Math.round(best.rate * 100) };
}

function strongCoOccurrences(data: AppData, today: Date) {
  const out: { a: string; b: string; coDayPct: number }[] = [];
  for (let i = 0; i < data.habits.length; i++) {
    for (let j = 0; j < data.habits.length; j++) {
      if (i === j) continue;
      const a = data.habits[i];
      const b = data.habits[j];
      let aDays = 0;
      let bothDays = 0;
      for (const [k, day] of Object.entries(data.completions)) {
        const d = parseDateKey(k);
        if (d > today) continue;
        if (day[a.id]?.done) {
          aDays++;
          if (day[b.id]?.done) bothDays++;
        }
      }
      if (aDays < 5) continue;
      const pct = Math.round((bothDays / aDays) * 100);
      if (pct >= 70) out.push({ a: a.name, b: b.name, coDayPct: pct });
    }
  }
  return out.sort((x, y) => y.coDayPct - x.coDayPct);
}

function streakWindow(habit: Habit, data: AppData, windowDays: number) {
  const today = new Date();
  const halfA: Date[] = [];
  const halfB: Date[] = [];
  for (let i = 0; i < windowDays * 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (!isExpectedToday(habit, d, data.completions)) continue;
    if (i < windowDays) halfA.push(d);
    else halfB.push(d);
  }
  if (halfA.length < 5 || halfB.length < 5) return { before: null, after: null };
  const aRate = halfA.filter(d => data.completions[dateKey(d)]?.[habit.id]?.done).length / halfA.length;
  const bRate = halfB.filter(d => data.completions[dateKey(d)]?.[habit.id]?.done).length / halfB.length;
  return { before: bRate, after: aRate };
}

void DOW_LABELS_SHORT;
