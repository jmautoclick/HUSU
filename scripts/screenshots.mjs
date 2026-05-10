import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const URL = 'http://localhost:5175/';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const SEED = (today) => {
  const k = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), x = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${x}`;
  };
  const c = {};
  for (let i = 0; i < 200; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const day = {};
    if (Math.random() > 0.05) day['1'] = { done: true };
    if (Math.random() > 0.20) day['2'] = i === 5 ? { done: true, note: 'Capítulo emocional, lloré un poco. Bien.' } : { done: true };
    if (d.getDay() >= 1 && d.getDay() <= 5 && Math.random() > 0.35) day['3'] = { done: true };
    if (Math.random() > 0.15) day['4'] = { done: true };
    if (Math.random() > 0.02) day['5'] = { done: true };
    if ([1, 2, 3, 4, 5].includes(d.getDay()) && Math.random() > 0.15) day['6'] = { done: true };
    if (Object.keys(day).length > 0) c[k(d)] = day;
  }
  return {
    schemaVersion: 2,
    habits: [
      { id: '1', name: 'Meditar 10 minutos', emoji: '🧘', colorIdx: 5, createdAt: '2026-02-01', monthlyGoal: 25, frequency: { type: 'daily' } },
      { id: '2', name: 'Leer 20 minutos', emoji: '📚', colorIdx: 7, createdAt: '2026-03-01', monthlyGoal: 25, frequency: { type: 'daily' } },
      { id: '3', name: 'Entrenamiento de fuerza', emoji: '🏋️', colorIdx: 0, createdAt: '2026-04-01', monthlyGoal: 16, frequency: { type: 'weekly', timesPerWeek: 4 } },
      { id: '4', name: 'Caminar 30 minutos', emoji: '🚶', colorIdx: 3, createdAt: '2026-04-01', monthlyGoal: 25, frequency: { type: 'daily' } },
      { id: '5', name: 'No fumar', emoji: '🚭', colorIdx: 4, createdAt: '2026-01-01', monthlyGoal: 30, frequency: { type: 'daily' } },
      { id: '6', name: 'Trabajo profundo', emoji: '💼', colorIdx: 6, createdAt: '2026-04-15', monthlyGoal: 20, frequency: { type: 'specific', weekdays: [1, 2, 3, 4, 5] } },
    ],
    completions: c,
    onboardingCompleted: true,
    achievements: ['first_habit', 'first_check', 'streak_3', 'streak_7', 'streak_14', 'streak_30', 'monthly_goal', 'perfect_day', 'five_habits'].map(id => ({ id, unlockedAt: '2026-04-01' })),
    theme: 'dark',
    lastMilestoneShown: {},
    identity: 'Alguien en paz',
    freezesRemaining: 1,
    freezesResetMonth: k(today).slice(0, 7),
    freezesUsed: {},
  };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log('saved', name);
}

async function reset(theme = 'dark', mode = 'fresh') {
  await page.goto(URL);
  if (mode === 'fresh') {
    await page.evaluate(() => localStorage.clear());
  } else {
    const data = SEED(new Date());
    data.theme = theme;
    await page.evaluate((d) => localStorage.setItem('husu-habits-data-v1', JSON.stringify(d)), data);
  }
  await page.reload();
  await page.waitForTimeout(800);
}

// 01 Welcome
await reset('dark', 'fresh');
await shot('01-welcome');

// 02 Identity
await page.locator('.onboarding-cta').click();
await shot('02-identity');

// 03 Templates picker (with first identity selected)
await page.locator('.identity-chip').first().click();
await page.locator('button:has-text("Seguir")').click();
await shot('03-templates-picker');

// 04 Registro with seed data
await reset('dark', 'seed');
await page.waitForTimeout(2000); // wait for freeze toast to fade
await shot('04-registro');

// 05 Stats Mes
await page.locator('.tab').nth(1).click();
await shot('05-stats-mes');

// 06 Stats Año (heatmap + streaks)
await page.locator('.segmented button:has-text("Año")').click();
await shot('06-stats-ano');

// 07 IA Coach
await page.locator('.tab').nth(2).click();
await shot('07-coach');

// 08 Hábitos tab
await page.locator('.tab').nth(3).click();
await shot('08-habitos');

// 09 Modal Hábito
await page.locator('.pill:has-text("Editar")').first().click();
await shot('09-modal-habito');
await page.locator('button:has-text("Cancelar")').click();

// 10 Light theme — Registro
await reset('light', 'seed');
await page.waitForTimeout(2000);
await shot('10-registro-light');

// 11 Achievements panel
await reset('dark', 'seed');
await page.waitForTimeout(2000);
await page.locator('.tab').nth(1).click();
await page.locator('.segmented button:has-text("Año")').click();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot('11-achievements');

await browser.close();
console.log('done');
