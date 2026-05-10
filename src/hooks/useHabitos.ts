import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, Habit, Frequency, Reminder, TimeSlot } from '../lib/types';
import { loadData, saveData } from '../lib/storage';
import { evaluate, asUnlocks } from '../lib/achievements';
import { autoApplyFreezes, currentStreak, isMilestone } from '../lib/streaks';
import { syncForHabit, cancelForHabit, listenForActions, ensureActionTypes } from '../lib/notifications';
import { celebrate, tapLight, tapMedium } from '../lib/haptics';
import { isExpectedToday } from '../lib/frequency';
import { dateKey, todayKey } from '../lib/dates';
import { HABIT_COLORS } from '../lib/colors';
import {
  type ToastSpec,
  streakToast,
  perfectDayToast,
  achievementToast,
  freezeToast,
} from '../components/MilestoneToast';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useHabitos() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [toastQueue, setToastQueue] = useState<ToastSpec[]>([]);
  const lastSync = useRef<string>('');
  const freezeChecked = useRef(false);

  useEffect(() => { saveData(data); }, [data]);

  useEffect(() => {
    if (freezeChecked.current || data.habits.length === 0) return;
    freezeChecked.current = true;
    const { applications, newData } = autoApplyFreezes(data);
    if (applications.length > 0) {
      setData(newData);
      setToastQueue(q => [...q, freezeToast(applications.map(a => a.habitName), newData.freezesRemaining)]);
    }
  }, [data]);

  useEffect(() => {
    void ensureActionTypes();
    void listenForActions((habitId) => {
      const k = todayKey();
      setData(d => {
        const day = { ...(d.completions[k] ?? {}) };
        const prev = day[habitId];
        if (prev?.done) return d;
        day[habitId] = { ...(prev ?? {}), done: true };
        return { ...d, completions: { ...d.completions, [k]: day } };
      });
      void tapLight();
    });
  }, []);

  useEffect(() => {
    const json = JSON.stringify(data.habits.map(h => ({ id: h.id, r: h.reminder, f: h.frequency })));
    if (json !== lastSync.current) {
      lastSync.current = json;
      data.habits.forEach(h => { void syncForHabit(h); });
    }
  }, [data.habits]);

  const enqueueToast = useCallback((t: ToastSpec) => {
    setToastQueue(q => [...q, t]);
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue(q => q.slice(1));
  }, []);

  const checkAchievements = useCallback((next: AppData) => {
    const unlocked = evaluate(next);
    if (unlocked.length === 0) return next;
    unlocked.forEach(id => enqueueToast(achievementToast(id)));
    return { ...next, achievements: [...next.achievements, ...asUnlocks(unlocked)] };
  }, [enqueueToast]);

  const addHabit = useCallback((name: string, colorIdx: number, monthlyGoal: number, opts?: { emoji?: string; frequency?: Frequency; intention?: string; timeSlot?: TimeSlot }) => {
    setData(d => {
      const h: Habit = {
        id: uid(),
        name,
        emoji: opts?.emoji,
        colorIdx,
        monthlyGoal,
        createdAt: dateKey(new Date()),
        frequency: opts?.frequency ?? { type: 'daily' },
        intention: opts?.intention,
        timeSlot: opts?.timeSlot,
      };
      return checkAchievements({ ...d, habits: [...d.habits, h] });
    });
    void tapLight();
  }, [checkAchievements]);

  const addManyHabits = useCallback((items: { name: string; colorIdx?: number; monthlyGoal: number; emoji?: string; frequency?: Frequency }[], identity?: string) => {
    setData(d => {
      const habits = [...d.habits];
      const used = new Set(habits.map(h => h.colorIdx));
      let cursor = 0;
      function nextColor(): number {
        if (cursor < HABIT_COLORS.length * 2) {
          for (let i = 0; i < HABIT_COLORS.length; i++) {
            const idx = (cursor + i) % HABIT_COLORS.length;
            if (!used.has(idx)) { used.add(idx); cursor = idx + 1; return idx; }
          }
        }
        const idx = habits.length % HABIT_COLORS.length;
        cursor = idx + 1;
        return idx;
      }
      for (const it of items) {
        habits.push({
          id: uid(),
          name: it.name,
          emoji: it.emoji,
          colorIdx: it.colorIdx ?? nextColor(),
          monthlyGoal: it.monthlyGoal,
          createdAt: dateKey(new Date()),
          frequency: it.frequency ?? { type: 'daily' },
        });
      }
      return checkAchievements({ ...d, habits, onboardingCompleted: true, identity: identity ?? d.identity });
    });
  }, [checkAchievements]);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setData(d => ({
      ...d,
      habits: d.habits.map(h => h.id === id ? { ...h, ...patch } : h),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setData(d => {
      const target = d.habits.find(h => h.id === id);
      if (target) void cancelForHabit(target);
      const completions = { ...d.completions };
      for (const k of Object.keys(completions)) {
        if (completions[k][id]) {
          const copy = { ...completions[k] };
          delete copy[id];
          completions[k] = copy;
        }
      }
      return { ...d, habits: d.habits.filter(h => h.id !== id), completions };
    });
  }, []);

  const moveHabit = useCallback((id: string, dir: -1 | 1) => {
    setData(d => {
      const idx = d.habits.findIndex(h => h.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= d.habits.length) return d;
      const habits = [...d.habits];
      [habits[idx], habits[newIdx]] = [habits[newIdx], habits[idx]];
      return { ...d, habits };
    });
  }, []);

  const toggleCompletion = useCallback((dateK: string, habitId: string) => {
    setData(d => {
      const day = { ...(d.completions[dateK] ?? {}) };
      const prev = day[habitId];
      const willBeDone = !prev?.done;
      day[habitId] = { ...(prev ?? {}), done: willBeDone };
      const next: AppData = { ...d, completions: { ...d.completions, [dateK]: day } };

      if (willBeDone) {
        void tapLight();
        const habit = next.habits.find(h => h.id === habitId);
        if (habit && dateK === todayKey()) {
          const streak = currentStreak(habit, next.completions, new Date(), next.freezesUsed);
          const lastShown = next.lastMilestoneShown[habit.id] ?? 0;
          if (isMilestone(streak) && streak > lastShown) {
            enqueueToast(streakToast(streak, habit.name));
            void celebrate();
            next.lastMilestoneShown = { ...next.lastMilestoneShown, [habit.id]: streak };
          }
          const expected = next.habits.filter(h => isExpectedToday(h, new Date(), next.completions));
          const allDone = expected.length > 0 && expected.every(h => next.completions[dateK]?.[h.id]?.done);
          if (allDone) {
            enqueueToast(perfectDayToast());
            void celebrate();
          }
        }
      }
      return checkAchievements(next);
    });
  }, [checkAchievements, enqueueToast]);

  const setNote = useCallback((dateK: string, habitId: string, note: string) => {
    setData(d => {
      const day = { ...(d.completions[dateK] ?? {}) };
      const prev = day[habitId] ?? { done: false };
      day[habitId] = { ...prev, note: note || undefined };
      return { ...d, completions: { ...d.completions, [dateK]: day } };
    });
  }, []);

  const setGeminiKey = useCallback((key: string) => {
    setData(d => ({ ...d, geminiKey: key || undefined }));
  }, []);

  const setReminder = useCallback((id: string, reminder: Reminder | undefined) => {
    setData(d => ({
      ...d,
      habits: d.habits.map(h => h.id === id ? { ...h, reminder } : h),
    }));
    void tapMedium();
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setData(d => ({ ...d, theme }));
  }, []);

  const completeOnboarding = useCallback((skip: boolean) => {
    setData(d => ({ ...d, onboardingCompleted: true }));
    if (skip) return;
  }, []);

  const dismissRecap = useCallback(() => {
    setData(d => ({ ...d, recapDismissedFor: dateKey(new Date()) }));
  }, []);

  const importData = useCallback((next: AppData) => {
    setData(prev => ({ ...next, geminiKey: prev.geminiKey, schemaVersion: 2 }));
  }, []);

  return {
    data,
    addHabit,
    addManyHabits,
    updateHabit,
    deleteHabit,
    moveHabit,
    toggleCompletion,
    setNote,
    setGeminiKey,
    setReminder,
    setTheme,
    completeOnboarding,
    importData,
    dismissRecap,
    toast: toastQueue[0] ?? null,
    dismissToast,
  };
}
