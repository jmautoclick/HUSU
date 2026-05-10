import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit } from './types';

export const HABIT_ACTION_TYPE = 'HABIT_REMINDER';

let actionsRegistered = false;

export async function ensureActionTypes() {
  if (actionsRegistered) return;
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: HABIT_ACTION_TYPE,
          actions: [
            { id: 'check', title: '✓ Hecho' },
            { id: 'skip', title: 'Saltar', destructive: false },
          ],
        },
      ],
    });
    actionsRegistered = true;
  } catch {}
}

export async function listenForActions(onCheck: (habitId: string) => void) {
  try {
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const habitId = event.notification.extra?.habitId;
      if (event.actionId === 'check' && habitId) onCheck(habitId);
    });
  } catch {}
}

export async function requestPermission(): Promise<boolean> {
  try {
    const res = await LocalNotifications.requestPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

export async function permissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const res = await LocalNotifications.checkPermissions();
    if (res.display === 'granted') return 'granted';
    if (res.display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'denied';
  }
}

function notificationIdFor(habitId: string, weekday?: number): number {
  let h = 0;
  const s = `${habitId}|${weekday ?? 'd'}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_000_000_000;
}

export async function syncForHabit(habit: Habit) {
  await cancelForHabit(habit);
  if (!habit.reminder?.enabled) return;
  const { hour, minute } = habit.reminder;
  const body = `No te olvides: ${habit.name}`;
  const opts: Array<{ id: number; weekday?: number }> = [];

  if (habit.frequency.type === 'specific') {
    for (const wd of habit.frequency.weekdays) opts.push({ id: notificationIdFor(habit.id, wd), weekday: wd });
  } else {
    opts.push({ id: notificationIdFor(habit.id) });
  }

  try {
    await ensureActionTypes();
    await LocalNotifications.schedule({
      notifications: opts.map(o => ({
        id: o.id,
        title: 'Husu Habits',
        body,
        actionTypeId: HABIT_ACTION_TYPE,
        extra: { habitId: habit.id },
        schedule: {
          on: o.weekday !== undefined
            ? { hour, minute, weekday: o.weekday + 1 }
            : { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        channelId: 'reminders',
      })),
    });
  } catch (e) {
    console.warn('schedule notification failed', e);
  }
}

export async function cancelForHabit(habit: Habit) {
  try {
    const ids: number[] = [notificationIdFor(habit.id)];
    if (habit.frequency.type === 'specific') {
      for (const wd of habit.frequency.weekdays) ids.push(notificationIdFor(habit.id, wd));
    }
    await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
  } catch {}
}

export async function syncAll(habits: Habit[]) {
  for (const h of habits) await syncForHabit(h);
}
