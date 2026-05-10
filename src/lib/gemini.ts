import type { AppData, Habit } from './types';
import { dateKey, parseDateKey, formatDayLong } from './dates';
import { detectPatterns } from './patterns';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function askGemini(apiKey: string, history: GeminiMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Gemini');
  return text.trim();
}

export function buildSystemContext(data: AppData): string {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lines: string[] = [];
  lines.push(`Sos HusuAI, un coach personal de hábitos amable y conciso. Hoy es ${formatDayLong(today)} ${dateKey(today)}.`);
  if (data.identity) {
    lines.push(`El usuario eligió esta identidad para sí mismo: "${data.identity}". Reforzá esa identidad en tus respuestas (Atomic Habits framework: identity-based habits).`);
  }
  lines.push(`REGLAS MÉDICAS ESTRICTAS:`);
  lines.push(`- NUNCA digas que cantidades moderadas o pequeñas de alcohol son saludables o seguras. WHO 2023: ningún nivel de consumo de alcohol es seguro para la salud.`);
  lines.push(`- NUNCA recetes ni des dosis específicas de medicamentos.`);
  lines.push(`- Si el usuario describe síntomas serios (depresión severa, ideación suicida, dolor torácico, etc), recomendale consultar un profesional o llamar al 107 (SAME Argentina) o servicios locales de emergencia.`);
  lines.push(`- Para cifras de actividad física, sueño, hidratación, citá WHO/OMS o "guidelines médicas" sin inventar números. Pasos: la evidencia (Lee 2019) muestra plateau de beneficios alrededor de 7.500/día, no 10.000.`);
  lines.push(`El usuario tiene estos hábitos:`);
  for (const h of data.habits) {
    const stats = monthlyStats(h, data, monthStart);
    lines.push(`- "${h.name}" (meta mensual: ${h.monthlyGoal} días, hechos este mes: ${stats.done}/${stats.total} días, frecuencia: ${describeFreq(h)}).`);
    const weekday = weekdayBreakdown(h, data);
    lines.push(`  Por día de semana este mes: ${weekday}`);
    if (h.intention) lines.push(`  Intención del usuario para este hábito: "${h.intention}".`);
    if (h.timeSlot && h.timeSlot !== 'anytime') lines.push(`  Momento del día asignado: ${h.timeSlot}.`);
  }
  const patterns = detectPatterns(data, today);
  if (patterns.length > 0) {
    lines.push(``);
    lines.push(`PATRONES DETECTADOS (usar para insights, citá la cifra cuando relevante):`);
    for (const p of patterns) lines.push(`- ${p.text}`);
  }
  lines.push('Respondé en español rioplatense, breve, accionable, sin emojis salvo uno ocasional.');
  return lines.join('\n');
}

function monthlyStats(h: Habit, data: AppData, monthStart: Date) {
  const today = new Date();
  let done = 0;
  let total = 0;
  for (let day = new Date(monthStart); day <= today; day.setDate(day.getDate() + 1)) {
    total++;
    if (data.completions[dateKey(day)]?.[h.id]) done++;
  }
  return { done, total };
}

function describeFreq(h: Habit): string {
  const f = h.frequency;
  if (f.type === 'daily') return 'diario';
  if (f.type === 'weekly') return `${f.timesPerWeek}x/semana`;
  const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return f.weekdays.map(d => labels[d]).join(' ');
}

function weekdayBreakdown(h: Habit, data: AppData): string {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const [k, day] of Object.entries(data.completions)) {
    const d = parseDateKey(k);
    totals[d.getDay()]++;
    if (day[h.id]) counts[d.getDay()]++;
  }
  const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return labels.map((l, i) => `${l}=${counts[i]}/${totals[i] || 0}`).join(' ');
}
