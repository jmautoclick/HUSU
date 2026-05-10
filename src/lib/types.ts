export type Frequency =
  | { type: 'daily' }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'specific'; weekdays: number[] };

export interface Reminder {
  hour: number;
  minute: number;
  enabled: boolean;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  colorIdx: number;
  createdAt: string;
  monthlyGoal: number;
  frequency: Frequency;
  reminder?: Reminder;
  intention?: string;
  timeSlot?: TimeSlot;
}

export interface DayEntry {
  done: boolean;
  note?: string;
}

export type Completions = Record<string, Record<string, DayEntry>>;

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

export interface AppData {
  schemaVersion: 2;
  habits: Habit[];
  completions: Completions;
  geminiKey?: string;
  achievements: AchievementUnlock[];
  onboardingCompleted: boolean;
  theme: 'dark' | 'light';
  lastMilestoneShown: Record<string, number>;
  identity?: string;
  freezesRemaining: number;
  freezesResetMonth: string;
  freezesUsed: Record<string, Record<string, true>>;
  recapDismissedFor?: string;
}

export type TabId = 'registro' | 'stats' | 'coach' | 'habitos';
