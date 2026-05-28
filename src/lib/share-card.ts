import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { WeekRecap } from './recap';
import { colorFor } from './colors';

const W = 1080;
const H = 1080;
const CLAY = '#C97B5A';
const CREAM = '#F5EFE6';
const INK = '#2A2823';
const EMBER = '#E5A04C';
const SAGE = '#7A9B7E';

export async function renderRecapCard(recap: WeekRecap): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, INK);
  grad.addColorStop(1, '#36332C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = CLAY;
  ctx.font = '900 96px serif';
  ctx.textAlign = 'left';
  ctx.fillText('Husu', 80, 160);
  ctx.fillStyle = CREAM;
  ctx.fillText('Habits', 80 + ctx.measureText('Husu ').width, 160);

  ctx.fillStyle = '#B8C5C1';
  ctx.font = '600 32px sans-serif';
  ctx.fillText('Resumen de la semana', 80, 220);
  ctx.font = '500 24px sans-serif';
  ctx.fillText(formatRange(recap.weekStart, recap.weekEnd), 80, 260);

  const ratePct = Math.round(recap.rate * 100);
  ctx.fillStyle = EMBER;
  ctx.font = '900 240px serif';
  const rateText = `${ratePct}%`;
  const rateW = ctx.measureText(rateText).width;
  ctx.fillText(rateText, (W - rateW) / 2, 540);

  ctx.fillStyle = CREAM;
  ctx.font = '600 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('de cumplimiento', W / 2, 600);

  const y = 700;
  ctx.textAlign = 'left';
  ctx.font = '600 28px sans-serif';

  drawStat(ctx, 80, y, '🌟', `${recap.perfectDays} días perfectos`, CREAM);
  drawStat(ctx, 80, y + 60, '✅', `${recap.totalDone}/${recap.totalExpected} hábitos`, CREAM);
  if (recap.topStreakHabit) {
    drawStat(ctx, 80, y + 120, '🔥', `Racha de ${recap.topStreakHabit.streak} días en "${truncate(recap.topStreakHabit.habit.name, 28)}"`, CREAM);
  }
  if (recap.bestHabit) {
    const c = colorFor(recap.bestHabit.habit.colorIdx);
    drawStat(ctx, 80, y + 180, '🏆', `Mejor: ${truncate(recap.bestHabit.habit.name, 24)} (${recap.bestHabit.doneCount}/${recap.bestHabit.expectedCount})`, c.bg);
  }

  ctx.fillStyle = SAGE;
  ctx.font = '700 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐼 husuhabits.app', W / 2, H - 60);

  return await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png', 0.95));
}

function drawStat(ctx: CanvasRenderingContext2D, x: number, y: number, emoji: string, text: string, color: string) {
  ctx.font = '40px sans-serif';
  ctx.fillText(emoji, x, y);
  ctx.fillStyle = color;
  ctx.font = '700 30px sans-serif';
  ctx.fillText(text, x + 60, y);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function formatRange(a: Date, b: Date): string {
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${a.getDate()} ${m[a.getMonth()]} — ${b.getDate()} ${m[b.getMonth()]} ${b.getFullYear()}`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/png;base64," prefix
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function shareRecap(recap: WeekRecap): Promise<void> {
  const blob = await renderRecapCard(recap);
  const filename = `husu-semana-${recap.weekEnd.toISOString().slice(0, 10)}.png`;

  if (Capacitor.isNativePlatform()) {
    // iOS/Android: escribimos PNG al cache + compartimos vía native share sheet
    const base64 = await blobToBase64(blob);
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    try {
      await Share.share({
        title: 'Mi semana en Husu Habits',
        text: 'Resumen de la semana',
        url: result.uri,
        dialogTitle: 'Compartir mi semana',
      });
    } catch (e) {
      if ((e as Error).message?.toLowerCase().includes('cancel')) return;
      console.warn('Share failed, file saved at:', result.uri);
    }
    return;
  }

  // Web — primero intento Web Share API (con files), después fallback download
  const file = new File([blob], filename, { type: 'image/png' });
  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    (navigator.canShare ? navigator.canShare({ files: [file] }) : true)
  ) {
    try {
      await navigator.share({ files: [file], title: 'Mi semana en Husu Habits' });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
