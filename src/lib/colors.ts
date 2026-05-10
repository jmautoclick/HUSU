export const HABIT_COLORS = [
  { bg: '#ef4444', dim: '#7f1d1d' },
  { bg: '#f97316', dim: '#7c2d12' },
  { bg: '#eab308', dim: '#713f12' },
  { bg: '#22c55e', dim: '#14532d' },
  { bg: '#10b981', dim: '#064e3b' },
  { bg: '#a855f7', dim: '#581c87' },
  { bg: '#3b82f6', dim: '#1e3a8a' },
  { bg: '#06b6d4', dim: '#164e63' },
  { bg: '#ec4899', dim: '#831843' },
  { bg: '#f43f5e', dim: '#881337' },
];

export function colorFor(idx: number) {
  return HABIT_COLORS[idx % HABIT_COLORS.length];
}
