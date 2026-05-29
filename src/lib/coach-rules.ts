// HusuAI v2 — Coach inteligente offline.
// 30+ intents, 50+ tips research-backed, proactive insights, follow-up
// suggestions, context-aware. Sin API key, offline, costo zero.

import type { AppData, Habit } from './types';
import { detectPatterns } from './patterns';
import { bestStreak, currentStreak, streakDisplay, bestStreakDisplay } from './streaks';
import { lastWeekRecap } from './recap';
import { isExpectedToday, expectedDaysInMonth } from './frequency';
import { dateKey, parseDateKey } from './dates';

export type Intent =
  // Saludos / cortesía
  | 'greet' | 'thanks'
  // Progreso
  | 'monthly_review' | 'weekly_review' | 'year_review' | 'perfect_days_count' | 'total_completions'
  // Patrones
  | 'weekday_pattern' | 'time_of_day_analysis' | 'habit_correlations' | 'weekend_vs_weekday'
  // Hábitos específicos
  | 'best_habit' | 'weakest_habit' | 'streak' | 'specific_habit' | 'abandoned_habit' | 'habit_breakdown'
  // Consejos / coaching
  | 'tip' | 'streak_protection_tip' | 'restart_from_fail' | 'low_friction_tip' | 'monday_blues'
  | 'morning_routine_tip' | 'evening_routine_tip'
  // Metas / futuro
  | 'next_goal' | 'monthly_projection' | 'ready_for_more' | 'habit_suggestion' | 'days_to_form'
  // Identidad / mood
  | 'identity' | 'motivate_me' | 'celebrate' | 'demotivated'
  // Reflexión
  | 'journal_review'
  // NUEVO en 2.1
  | 'yesterday' | 'time_since' | 'compare_habits' | 'today_outlook' | 'sufficient_eval'
  | 'daily_brief' | 'capabilities' | 'fallback';

interface Classification {
  intent: Intent;
  habit?: Habit;
  score: number;
  originalQuestion?: string;
  mood?: 'low' | 'neutral';
}

// Detección de mood bajo en el texto del user (frustración/cansancio/duda)
const LOW_MOOD_MARKERS = [
  'no doy mas', 'harto', 'cansado', 'cansada', 'agotado', 'agotada',
  'para que', 'no sirve', 'nada me sale', 'no puedo', 'sin ganas',
  'mal dia', 'estoy mal', 'me cuesta todo', 'odio', 'odiando',
  'fracaso', 'rendirme', 'abandonar', 'dejar todo', 'no aguanto',
];

function detectMood(q: string): 'low' | 'neutral' {
  for (const marker of LOW_MOOD_MARKERS) {
    if (q.includes(marker)) return 'low';
  }
  return 'neutral';
}

const DOW_LABELS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿¡!?.,;:]/g, '')
    .trim();
}

// Escapa metacaracteres regex. CRÍTICO: los nombres de hábito son input del
// usuario y se usan en new RegExp(). Sin esto, un hábito llamado "Rutina(am"
// o "Leer [x" o "foco++" tira SyntaxError y CRASHEA el Coach entero.
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface IntentPattern {
  intent: Intent;
  keywords: string[];     // si alguno está, suma a score
  required?: string[];    // alguno de estos DEBE estar
  weight?: number;
}

// Sistema de scoring: cada intent tiene keywords. La pregunta del user se
// matchea contra todos, gana el de mayor score. Esto permite respuestas más
// precisas que first-match.
const INTENT_PATTERNS: IntentPattern[] = [
  { intent: 'greet', keywords: ['hola', 'que tal', 'buen dia', 'buenas', 'hey', 'hi ', 'hello'], weight: 3 },
  { intent: 'thanks', keywords: ['gracias', 'mil gracias', 'genial', 'buenisimo'], weight: 3 },
  { intent: 'capabilities', keywords: ['que podes hacer', 'que sabes hacer', 'en que me ayudas', 'en que me podes ayudar', 'ayuda', 'que puedo preguntar', 'que te puedo preguntar', 'como funciona', 'que haces', 'para que servis', 'que sabes de mi', 'opciones', 'que mas'], weight: 3 },

  // Progreso
  { intent: 'monthly_review', keywords: ['como voy', 'como estoy', 'como vengo', 'que tal voy', 'mi mes', 'progreso', 'este mes', 'numeros del mes', 'como vengo este mes'], weight: 2 },
  { intent: 'weekly_review', keywords: ['semana', 'esta semana', 'mi semana', 'como va la semana'], weight: 2 },
  { intent: 'year_review', keywords: ['año', 'ano', 'anual', 'numeros del año', 'mejor mes', 'mi año'], weight: 2 },
  { intent: 'perfect_days_count', keywords: ['perfectos', 'dias perfectos', 'cuantos perfectos'], weight: 3 },
  { intent: 'total_completions', keywords: ['cuantos en total', 'total de habitos', 'cuantos he completado', 'todos los que hice'], weight: 3 },

  // Patrones
  { intent: 'weekday_pattern', keywords: ['que dia', 'dias que fallo', 'patron', 'dia de la semana', 'fallo mas', 'cual dia', 'por que fallo', 'por que los', 'que dia me cuesta'], weight: 2 },
  { intent: 'time_of_day_analysis', keywords: ['mañana o noche', 'manana o noche', 'mañana o tarde', 'que horario', 'a que hora soy', 'mas constante mañana', 'mas constante de noche'], weight: 3 },
  { intent: 'habit_correlations', keywords: ['correlacion', 'van juntos', 'que habitos van', 'cuando hago x', 'que relacion', 'estan relacionados'], weight: 3 },
  { intent: 'weekend_vs_weekday', keywords: ['fin de semana', 'finde', 'sabados y domingos', 'semana vs finde'], weight: 3 },

  // Hábitos
  { intent: 'best_habit', keywords: ['mejor habito', 'top habito', 'destacado', 'cual va mejor', 'cual es mi mejor'], weight: 3 },
  { intent: 'weakest_habit', keywords: ['necesita atencion', 'abandonando', 'peor habito', 'cual mejorar', 'mas atrasado', 'mas atrasada', 'cual estoy perdiendo', 'me cuesta', 'no me sale', 'cual me cuesta', 'por que me cuesta', 'cual va peor'], weight: 3 },
  { intent: 'streak', keywords: ['racha', 'seguido', 'dias seguidos', 'cuanto llevo'], weight: 2 },
  { intent: 'abandoned_habit', keywords: ['abandone', 'hace tiempo que no', 'olvidado', 'deje de hacer', 'no hice mas', 'cual deje'], weight: 3 },
  { intent: 'habit_breakdown', keywords: ['analiza', 'analizame', 'breakdown', 'detallame', 'profundo', 'a fondo'], weight: 2 },

  // Consejos
  { intent: 'tip', keywords: ['consejo', 'tip', 'idea', 'recomenda', 'sugerencia', 'sugeri'], weight: 2 },
  { intent: 'streak_protection_tip', keywords: ['mantener la racha', 'no perder racha', 'proteger racha', 'no romper'], weight: 3 },
  { intent: 'restart_from_fail', keywords: ['volver despues', 'arrancar despues de fallar', 'como vuelvo', 'recaida', 'me cai', 'recomenzar', 'reset', 'desde cero'], weight: 3 },
  { intent: 'low_friction_tip', keywords: ['friccion', 'mas facil', 'simplificar', 'bajar la barra', 'menos esfuerzo'], weight: 3 },
  { intent: 'monday_blues', keywords: ['lunes', 'arrancar la semana', 'lunes dificil', 'lunes me cuesta'], weight: 3 },
  { intent: 'morning_routine_tip', keywords: ['rutina mañana', 'rutina manana', 'mañanas', 'mananas', 'arrancar el dia'], weight: 3 },
  { intent: 'evening_routine_tip', keywords: ['rutina noche', 'noche', 'antes de dormir', 'cerrar el dia'], weight: 2 },

  // Metas
  { intent: 'next_goal', keywords: ['meta', 'cuanto falta', 'cumplir meta', 'voy a cumplir', 'llego a la meta', 'cerca de meta'], weight: 2 },
  { intent: 'monthly_projection', keywords: ['proyecta', 'proyectame', 'como termino', 'donde voy a quedar', 'fin de mes', 'cierre del mes'], weight: 3 },
  { intent: 'ready_for_more', keywords: ['sumar otro', 'agregar un habito', 'estoy listo', 'puedo sumar', 'mas habitos', 'cuanto mas puedo'], weight: 3 },
  { intent: 'habit_suggestion', keywords: ['que habito', 'que sumar', 'cual sumar', 'recomendame habito', 'sugeri un habito'], weight: 3 },
  { intent: 'days_to_form', keywords: ['cuando se forma', 'cuando es habito', 'cuantos dias para', '66 dias', '21 dias', 'forma del habito'], weight: 3 },

  // Identidad / mood
  { intent: 'identity', keywords: ['quien soy', 'identidad', 'que tipo soy', 'recordame quien'], weight: 3 },
  { intent: 'motivate_me', keywords: ['motivame', 'motivar', 'animame', 'dame fuerza', 'necesito energia'], weight: 3 },
  { intent: 'demotivated', keywords: ['desmotivado', 'cansado', 'no doy mas', 'estoy mal', 'no quiero', 'sin ganas', 'agobiado'], weight: 3 },
  { intent: 'celebrate', keywords: ['logre', 'lo hice', 'cumpli', 'gane', 'logro', 'felicitame'], weight: 3 },

  // Reflexión
  { intent: 'journal_review', keywords: ['mis notas', 'que escribi', 'leeme las notas', 'journal', 'que reflexione'], weight: 3 },

  // NUEVO en 2.1 — queries temporales
  { intent: 'yesterday', keywords: ['ayer', 'como me fue ayer', 'el dia de ayer'], weight: 3 },
  { intent: 'time_since', keywords: ['hace cuanto', 'cuanto hace que', 'cuanto tiempo sin', 'ultima vez que'], weight: 3 },
  { intent: 'compare_habits', keywords: ['compara', 'compari', 'companame', 'diferencia entre', 'vs', 'versus'], weight: 3 },
  { intent: 'today_outlook', keywords: ['hoy tengo', 'que tengo hoy', 'plan de hoy', 'que me toca hoy', 'agenda de hoy'], weight: 3 },
  { intent: 'sufficient_eval', keywords: ['hago suficiente', 'estoy haciendo lo suficiente', 'es bastante', 'soy constante', 'mi nivel'], weight: 3 },
  { intent: 'daily_brief', keywords: ['brief', 'resumen del dia', 'arrancame el dia', 'dame mi resumen'], weight: 3 },
];

function anyOf(text: string, words: string[]): boolean {
  return words.some(w => text.includes(w));
}

function classify(question: string, habits: Habit[]): Classification {
  const q = normalize(question);

  // 1. Detectar habit mencionado (sin cortocircuitar — solo guardar referencia)
  // Match: nombre completo, palabra completa de >3 chars, o prefix de 5+ chars
  // (para soportar conjugaciones: "entreno"/"entrena" matchean "entrenar")
  let detectedHabit: Habit | undefined;
  for (const h of habits) {
    const hName = normalize(h.name);
    if (q.includes(hName)) { detectedHabit = h; break; }
    const words = hName.split(/\s+/).filter(w => w.length > 3 && !['para', 'estar', 'estoy', 'minutos', 'minuto', 'dias', 'esta', 'pre-sueño', 'sueño'].includes(w));
    for (const w of words) {
      if (new RegExp(`\\b${escapeRegex(w)}\\b`).test(q)) { detectedHabit = h; break; }
      // prefix match (raíz verbal/sustantiva)
      if (w.length >= 5 && new RegExp(`\\b${escapeRegex(w.slice(0, 5))}\\w*\\b`).test(q)) { detectedHabit = h; break; }
    }
    if (detectedHabit) break;
  }

  // 2. Score-based matching contra todos los intents
  let best: Classification = { intent: 'fallback', score: 0 };
  for (const p of INTENT_PATTERNS) {
    const weight = p.weight ?? 1;
    let score = 0;
    for (const kw of p.keywords) {
      if (q.includes(kw)) score += weight + (kw.length > 12 ? 2 : 0);
    }
    if (p.required && !anyOf(q, p.required)) continue;
    if (score > best.score) best = { intent: p.intent, score };
  }

  // 3. Detectar mood
  const mood = detectMood(q);

  // Si hay low mood Y no preguntó algo específico → override a demotivated
  if (mood === 'low' && best.score < 3) {
    return { intent: 'demotivated', score: 10, habit: detectedHabit, mood };
  }

  // 4. Resolución habit + intent
  if (detectedHabit && best.score < 3) {
    return { intent: 'specific_habit', habit: detectedHabit, score: 10, mood };
  }
  if (detectedHabit) {
    return { ...best, habit: detectedHabit, mood };
  }
  return { ...best, mood };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ COMPOSERS ============

function greetResponse(data: AppData): string {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return pick([
    `${timeGreet}. ¿Querés que mire cómo venís este mes?`,
    `${timeGreet} 🐼 ¿En qué te puedo ayudar hoy?`,
    `Hola. Tenés ${data.habits.length} hábitos activos. Preguntame lo que quieras.`,
    `${timeGreet}. Probá tocar una sugerencia o escribime libre.`,
    hour < 8 ? '¡Madrugaste! Buen momento para dejar listo el día.' : `${timeGreet}, ¿cómo va el día?`,
  ]);
}

function thanksResponse(): string {
  return pick([
    'Cuando quieras 🐼',
    'Dale, vos podés. Estoy acá.',
    'Tranqui, cuando necesites.',
    'A vos. Seguimos.',
    'De nada. Que tengas buen día.',
  ]);
}

function capabilitiesResponse(data: AppData): string {
  const n = data.habits.length;
  const top = data.habits
    .map(h => ({ h, s: currentStreak(h, data.completions, new Date(), data.freezesUsed) }))
    .sort((a, b) => b.s - a.s)[0];
  const ejemplo = top && top.s > 0 ? `cómo voy con ${top.h.name}` : 'cómo voy este mes';
  return `Soy tu coach y conozco **todo tu historial** (${n} ${n === 1 ? 'hábito' : 'hábitos'}, rachas, patrones por día y franja horaria, lo que se cae). Puedo:\n• 📊 Analizar tu progreso — "cómo voy este mes", "mi semana"\n• 🔎 Detectar patrones — "qué día fallo más", "mañana o noche"\n• 🎯 Proyectar metas — "voy a llegar a la meta este mes"\n• 💡 Darte consejos basados en TU data real, no genéricos\n• ⚖️ Comparar hábitos — "compará leer con meditar"\n\nProbá ahora: "${ejemplo}".`;
}

function monthlyReview(data: AppData): string {
  const today = new Date();
  const monthName = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][today.getMonth()];
  let totalExpected = 0, totalDone = 0;
  const perHabit: Array<{ h: Habit; done: number; expected: number; rate: number }> = [];

  for (const h of data.habits) {
    let exp = 0, done = 0;
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    if (exp === 0) continue;
    perHabit.push({ h, done, expected: exp, rate: done / exp });
    totalExpected += exp; totalDone += done;
  }
  if (totalExpected === 0) return 'Este mes todavía no marcaste nada. Empezá hoy — el día 1 vale igual que el 30.';

  const rate = Math.round((totalDone / totalExpected) * 100);
  perHabit.sort((a, b) => b.rate - a.rate);
  const top = perHabit[0], bottom = perHabit[perHabit.length - 1];

  const intro =
    rate >= 85 ? `Mes top: ${rate}% en ${monthName}. Estás en zona de identidad.` :
    rate >= 70 ? `Buen mes, ${rate}% en ${monthName}. Vas sólido.` :
    rate >= 50 ? `Mes a medias, ${rate}% en ${monthName}. Recuperable.` :
                 `Mes flojo, ${rate}% en ${monthName}. Sin culpa, vamos paso a paso.`;
  const topLine = top ? ` Lo mejor: "${top.h.name}" (${Math.round(top.rate * 100)}%).` : '';
  const bottomLine = (bottom && bottom !== top && bottom.rate < 0.6) ? ` Lo más flojo: "${bottom.h.name}" (${Math.round(bottom.rate * 100)}%).` : '';
  return intro + topLine + bottomLine;
}

function weeklyReview(data: AppData): string {
  const recap = lastWeekRecap(data);
  if (recap.totalExpected === 0) return 'Sin datos de la semana pasada. Marcá hoy uno para empezar.';
  const rate = Math.round(recap.rate * 100);
  const perfectLine = recap.perfectDays > 0 ? ` Tuviste ${recap.perfectDays} ${recap.perfectDays === 1 ? 'día perfecto' : 'días perfectos'}.` : '';
  const topLine = recap.topStreakHabit ? ` Tu mejor racha activa: ${recap.topStreakHabit.streak} días en "${recap.topStreakHabit.habit.name}".` : '';
  return `Semana pasada: ${rate}% (${recap.totalDone}/${recap.totalExpected}).${perfectLine}${topLine}`;
}

function yearReview(data: AppData): string {
  const today = new Date();
  const year = today.getFullYear();
  let totalDone = 0;
  const perMonth = Array(12).fill(0).map(() => ({ done: 0, expected: 0 }));

  for (const [k, day] of Object.entries(data.completions)) {
    const d = parseDateKey(k);
    if (d.getFullYear() !== year) continue;
    for (const h of data.habits) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      perMonth[d.getMonth()].expected++;
      if (day[h.id]?.done) {
        perMonth[d.getMonth()].done++;
        totalDone++;
      }
    }
  }

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const ratesByMonth = perMonth.map((m, i) => ({ i, rate: m.expected > 0 ? m.done / m.expected : -1, ...m }));
  const valid = ratesByMonth.filter(m => m.rate >= 0);
  if (valid.length === 0) return `Año ${year} empezando. Todavía no hay datos para resumir.`;

  const best = valid.reduce((max, m) => m.rate > max.rate ? m : max);
  return `Año ${year}: ${totalDone} checks totales. Mejor mes: ${months[best.i]} (${Math.round(best.rate * 100)}%).`;
}

function perfectDaysCount(data: AppData): string {
  const today = new Date();
  let count = 0;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
    const expected = data.habits.filter(h => isExpectedToday(h, d, data.completions));
    if (expected.length === 0) continue;
    const dayCompletions = data.completions[dateKey(d)] ?? {};
    const allDone = expected.every(h => dayCompletions[h.id]?.done);
    if (allDone) count++;
  }
  if (count === 0) return 'Aún no tuviste un día perfecto este mes. Concentrate en uno solo — la racha empieza con el primero.';
  if (count >= 15) return `${count} días perfectos este mes 🌟. Esto ya es identidad construida, no fuerza de voluntad.`;
  return `${count} ${count === 1 ? 'día perfecto' : 'días perfectos'} este mes 🌟. Cada uno es un voto a la identidad que estás construyendo.`;
}

function totalCompletions(data: AppData): string {
  let total = 0;
  let firstDate: Date | null = null;
  for (const [k, day] of Object.entries(data.completions)) {
    for (const _h of data.habits) {
      if (day[_h.id]?.done) {
        total++;
        const d = parseDateKey(k);
        if (!firstDate || d < firstDate) firstDate = d;
      }
    }
  }
  if (total === 0) return 'Aún no tenés checks. ¡Hagamos el primero!';
  const since = firstDate ? ` desde ${firstDate.getDate()}/${firstDate.getMonth() + 1}/${firstDate.getFullYear()}` : '';
  return `Llevás ${total.toLocaleString('es-AR')} checks totales${since}. Cada uno es un voto. Estás construyendo algo.`;
}

function weekdayPatternResponse(data: AppData): string {
  const patterns = detectPatterns(data);
  const weakInsight = patterns.find(p => /los \w+ cumple solo/.test(p.text));
  if (weakInsight) {
    return `${weakInsight.text} Idea: ese día más flojo, prepará el entorno la noche anterior (Wendy Wood, USC: el contexto importa más que la motivación).`;
  }
  const counts = [0, 0, 0, 0, 0, 0, 0], totals = [0, 0, 0, 0, 0, 0, 0];
  for (const [k, day] of Object.entries(data.completions)) {
    const d = parseDateKey(k);
    for (const h of data.habits) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      totals[d.getDay()]++;
      if (day[h.id]?.done) counts[d.getDay()]++;
    }
  }
  const rates = counts.map((c, i) => ({ day: i, rate: totals[i] > 0 ? c / totals[i] : -1 }));
  const valid = rates.filter(r => r.rate >= 0);
  if (valid.length < 2) return 'Marcá unos días más y te detecto el patrón. Necesito al menos una semana completa.';
  const worst = valid.reduce((min, r) => r.rate < min.rate ? r : min);
  const best = valid.reduce((max, r) => r.rate > max.rate ? r : max);
  if (best.rate - worst.rate < 0.15) return 'Tu rendimiento es bastante parejo en toda la semana. Buena base — podrías empujar uno o dos hábitos más.';
  return `Mejor día: ${DOW_LABELS[best.day]} (${Math.round(best.rate * 100)}%). Más flojo: ${DOW_LABELS[worst.day]} (${Math.round(worst.rate * 100)}%). Diferencia clave: prepará el entorno antes.`;
}

function timeOfDayAnalysis(data: AppData): string {
  const buckets: Record<string, { done: number; expected: number }> = {
    morning: { done: 0, expected: 0 },
    afternoon: { done: 0, expected: 0 },
    evening: { done: 0, expected: 0 },
    anytime: { done: 0, expected: 0 },
  };
  for (const h of data.habits) {
    const slot = h.timeSlot ?? 'anytime';
    for (const [k, day] of Object.entries(data.completions)) {
      const d = parseDateKey(k);
      if (!isExpectedToday(h, d, data.completions)) continue;
      buckets[slot].expected++;
      if (day[h.id]?.done) buckets[slot].done++;
    }
  }
  const rates = Object.entries(buckets)
    .filter(([, v]) => v.expected >= 5)
    .map(([slot, v]) => ({ slot, rate: v.done / v.expected, n: v.expected }));
  if (rates.length < 2) return 'No tengo suficiente data por momento del día. Asigná momentos a tus hábitos en el modal de edición y vuelvo a analizar.';
  rates.sort((a, b) => b.rate - a.rate);
  const labels: Record<string, string> = { morning: 'mañana', afternoon: 'tarde', evening: 'noche', anytime: 'cualquier momento' };
  const best = rates[0], worst = rates[rates.length - 1];
  if (best.rate - worst.rate < 0.15) return 'Sos parejo en todos los momentos del día. Buena señal — tu rutina está distribuida.';
  return `Sos más constante a la ${labels[best.slot]} (${Math.round(best.rate * 100)}%) que a la ${labels[worst.slot]} (${Math.round(worst.rate * 100)}%). Si podés, agendá lo importante en tu mejor franja.`;
}

function habitCorrelations(data: AppData): string {
  const patterns = detectPatterns(data);
  const corrs = patterns.filter(p => /correlación fuerte/.test(p.text));
  if (corrs.length === 0) {
    if (data.habits.length < 2) return 'Necesito 2+ hábitos para detectar correlaciones. Sumá otro y te las muestro.';
    return 'No detecté correlaciones fuertes (>70% co-ocurrencia). Eso significa que tus hábitos son independientes — bueno si querés diversificar, no tan bueno si quisieras encadenarlos.';
  }
  return `Tus hábitos encadenados:\n${corrs.slice(0, 3).map(p => `• ${p.text}`).join('\n')}\n\nIdea (habit stacking): aprovechá esa correlación. El cue ya está.`;
}

function weekendVsWeekday(data: AppData): string {
  let wkDone = 0, wkExp = 0, wdDone = 0, wdExp = 0;
  for (const [k, day] of Object.entries(data.completions)) {
    const d = parseDateKey(k);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    for (const h of data.habits) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      if (isWeekend) {
        wkExp++; if (day[h.id]?.done) wkDone++;
      } else {
        wdExp++; if (day[h.id]?.done) wdDone++;
      }
    }
  }
  if (wkExp < 4 || wdExp < 10) return 'Necesito más data. Volvé en una semana.';
  const wkRate = Math.round((wkDone / wkExp) * 100);
  const wdRate = Math.round((wdDone / wdExp) * 100);
  const diff = wdRate - wkRate;
  if (Math.abs(diff) < 8) return `Pareja la cosa: ${wkRate}% finde vs ${wdRate}% semana. Tu rutina aguanta el cambio de contexto.`;
  if (diff > 0) return `Te cuesta más el finde: ${wkRate}% vs ${wdRate}% en semana. Probá mantener al menos UN ancla los fines (un hábito fijo, misma hora).`;
  return `Curioso — andás mejor el finde (${wkRate}%) que en semana (${wdRate}%). Pista: hay algo en la semana que está rompiendo el flow.`;
}

function bestHabitResponse(data: AppData): string {
  const list = data.habits.map(h => ({
    h,
    streak: currentStreak(h, data.completions, new Date(), data.freezesUsed),
    best: bestStreak(h, data.completions),
  })).sort((a, b) => b.streak - a.streak || b.best - a.best);
  const top = list[0];
  if (!top || top.streak === 0) return 'Ninguno con racha activa ahora. Lo importante es volver hoy, no ayer.';
  // streakDisplay: días para daily/specific, semanas para weekly.
  const sd = streakDisplay(top.h, data.completions, new Date(), data.freezesUsed);
  return `"${top.h.name}" va al frente: ${sd.value} ${sd.unit} de racha actual. Identidad construida, no esfuerzo. Cuidalo.`;
}

function weakestHabitResponse(data: AppData): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const candidates = data.habits.map(h => {
    let exp = 0, done = 0;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    return { h, exp, done, rate: exp > 0 ? done / exp : -1 };
  }).filter(c => c.rate >= 0).sort((a, b) => a.rate - b.rate);
  if (candidates.length === 0) return 'Sin datos este mes. Empezá hoy con uno.';
  const worst = candidates[0];
  if (worst.rate >= 0.8) return `Ninguno está abandonado — todos arriba del 80%. Sos parejo.`;
  return pick([
    `"${worst.h.name}" es el que más te cuesta (${Math.round(worst.rate * 100)}% este mes). Bajá la barra: hacelo 2 minutos. Lo que importa es no romper la identidad.`,
    `Para "${worst.h.name}" (${Math.round(worst.rate * 100)}%), probá habit stacking: hacelo justo después de un hábito que SÍ cumplís. El cue ya está consolidado.`,
    `"${worst.h.name}" se quedó atrás (${Math.round(worst.rate * 100)}%). Pregunta clave: ¿el momento del día asignado te funciona, o lo tenés a una hora donde nunca tenés energía?`,
    `"${worst.h.name}" anda al ${Math.round(worst.rate * 100)}%. James Clear diría: ¿está obvio? ¿atractivo? ¿fácil? ¿satisfactorio? Identificá cuál de las 4 leyes está rota.`,
  ]);
}

function streakResponse(data: AppData): string {
  // streakDisplay: días (daily/specific) o semanas (weekly), con la unidad correcta.
  const list = data.habits.map(h => ({
    h, sd: streakDisplay(h, data.completions, new Date(), data.freezesUsed),
  })).filter(x => x.sd.value > 0).sort((a, b) => b.sd.value - a.sd.value);
  if (list.length === 0) return 'Sin rachas activas ahora. Marcá hoy uno y empezás de nuevo. Día 1 vale igual que día 100.';
  if (list.length === 1) return `Tu única racha activa: ${list[0].sd.value} ${list[0].sd.unit} en "${list[0].h.name}" 🔥`;
  return `Rachas activas:\n${list.slice(0, 5).map(x => `• "${x.h.name}": ${x.sd.value} ${x.sd.unit}`).join('\n')}`;
}

function abandonedHabit(data: AppData): string {
  const today = new Date();
  const candidates = data.habits.map(h => {
    let lastDone: Date | null = null;
    for (const [k, day] of Object.entries(data.completions)) {
      if (!day[h.id]?.done) continue;
      const d = parseDateKey(k);
      if (!lastDone || d > lastDone) lastDone = d;
    }
    const daysSince = lastDone ? Math.floor((today.getTime() - lastDone.getTime()) / (24 * 60 * 60 * 1000)) : 999;
    return { h, lastDone, daysSince };
  }).filter(c => c.daysSince > 7).sort((a, b) => b.daysSince - a.daysSince);
  if (candidates.length === 0) return 'No hay nada abandonado. Tocás todos al menos cada semana. 👏';
  const worst = candidates[0];
  if (worst.daysSince > 60) return `"${worst.h.name}" — sin tocar hace ${worst.daysSince} días. Quizás vale revisarlo: ¿lo querés realmente? Si la respuesta es "no", borralo. Menos es más.`;
  return `"${worst.h.name}" — sin tocar hace ${worst.daysSince} días. ¿Olvido o cambio de prioridades? Si lo querés recuperar, empezá con uno bien chiquito hoy.`;
}

function habitBreakdown(data: AppData, h?: Habit): string {
  // Si no se pasó hábito, usar el "top" (más constante)
  const target = h ?? data.habits.map(hh => ({ h: hh, s: currentStreak(hh, data.completions, new Date(), data.freezesUsed) })).sort((a, b) => b.s - a.s)[0]?.h;
  if (!target) return 'No tenés hábitos cargados todavía.';
  return specificHabitResponse(data, target);
}

function specificHabitResponse(data: AppData, h: Habit): string {
  // Unidad correcta: días (daily/specific) o semanas (weekly).
  const sd = streakDisplay(h, data.completions, new Date(), data.freezesUsed);
  const bd = bestStreakDisplay(h, data.completions, new Date());
  const today = new Date();
  let exp = 0, done = 0;
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (!isExpectedToday(h, d, data.completions)) continue;
    exp++;
    if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
  }
  const rate = exp > 0 ? Math.round((done / exp) * 100) : 0;
  return `"${h.name}": ${done}/${exp} este mes (${rate}%). Racha actual: ${sd.value} ${sd.unit}. Mejor histórica: ${bd.value} ${bd.unit}.`;
}

// ============ Tips database (50+) ============
const TIPS = {
  identity: [
    'Identidad antes que acción. No digas "voy a leer", decí "soy alguien que lee". Cambia la pregunta interna (Atomic Habits, James Clear).',
    'Cada check es un voto a la identidad que estás construyendo. No te enfoques en la meta, enfocate en el voto de hoy.',
    'Preguntá: "¿qué haría hoy alguien que YA es [tu identidad]?". Después hacé eso.',
    'Si fallás un día, no rompiste la identidad. Si fallás dos seguidos, sí.',
  ],
  cue: [
    'La voluntad es agotable, el entorno no. Dejá la guitarra a la vista, las galletitas en el último cajón. El espacio te dirige (Wendy Wood, USC).',
    'Hacé el cue OBVIO. Botella de agua en el escritorio. Libro sobre la almohada. Ropa de gym lista la noche anterior.',
    'Para evitar un hábito malo: hacé el cue INVISIBLE. Saca el celular del cuarto. Borrá la app.',
    'Implementation intentions (Gollwitzer, d=0.65 effect size): "cuando X pasa, voy a Y". Especificá CUÁNDO y DÓNDE.',
  ],
  start: [
    'Regla de los 2 minutos (James Clear): si te cuesta arrancar, reducilo a algo que tarde 2 min. "Leer un libro" → "leer una página".',
    'No tenés que ser perfecto el día 1. Solo tenés que arrancar.',
    'Habit stacking: "después de X (que ya hago), voy a Y". Conectá el nuevo a un cue consolidado.',
    'Mediana real para automatizar: 66 días (Lally et al., UCL 2010). No 21. Sé paciente.',
  ],
  recovery: [
    'No rompas la cadena 2 días seguidos. 1 día es accidente, 2 es un patrón nuevo. Esa es la línea roja.',
    'El día después de fallar es cuando se decide el hábito. No el día que lo hiciste bien.',
    'Si fallás, no compenses. Si fallaste hoy, mañana hacé lo mismo de siempre. La sobrecompensación rompe más rachas que el fallo.',
    'What-the-hell effect: cuidado con "ya rompí la dieta, qué más da". Esa frase es la trampa, no el fallo en sí.',
  ],
  motivation: [
    'Tu yo de mañana NO va a tener más voluntad que vos hoy. Decidí ahora, no más tarde.',
    'Variable rewards funcionan mejor que predecibles (Skinner). Variá el premio post-hábito.',
    'La motivación llega DESPUÉS de la acción, no antes. No esperés a tener ganas.',
    'Si la motivación te falla, confiá en el sistema. El sistema es la rutina, el cue, el entorno.',
  ],
  friction: [
    'Bajar la fricción: hacé el hábito 20 segundos más fácil. Botella ya llena, app abierta, ropa lista.',
    'Subir la fricción del hábito malo: 20 segundos más difícil. Logout de redes. Sacar el snack de casa.',
    'Si vivís a más de 30 min del gym, vas a ir un 50% menos (datos de behavior research). Geografía > willpower.',
    'Temptation bundling (Katy Milkman): combiná lo que te cuesta con lo que disfrutás. Solo escuchás tu podcast favorito mientras corrés.',
  ],
  social: [
    'Public commitment aumenta adherencia 65% (Hollenbeck & Klein, 1987). Decile a alguien lo que vas a hacer.',
    'Estar rodeado de gente que ya tiene el hábito acelera el cambio. La identidad colectiva tira.',
    'Si no tenés ese círculo, leer/escuchar gente que SÍ lo tiene también ayuda (parasocial).',
  ],
  measurement: [
    'Lo que se mide, mejora. Lo que se mide PÚBLICAMENTE, mejora el doble.',
    'Don\'t break the chain (Seinfeld\'s folk-rule): tenés que ver la cadena para protegerla.',
    'Streaks > metas perfectas. La meta es 30, la racha es ahora.',
  ],
};

const ALL_TIPS = Object.values(TIPS).flat();

function tipResponse(data: AppData): string {
  // 40% chance de devolver insight personalizado, 60% tip genérico
  const patterns = detectPatterns(data);
  if (patterns.length > 0 && Math.random() < 0.4) {
    return `Algo que noté: ${patterns[0].text} ${pick(['¿Tiene sentido?', 'Mirá si podés ajustar ahí.', 'Vale la pena observarlo.'])}`;
  }
  return pick(ALL_TIPS);
}

function streakProtectionTip(data: AppData): string {
  const list = data.habits.map(h => currentStreak(h, data.completions, new Date(), data.freezesUsed)).filter(s => s > 0);
  const maxStreak = list.length > 0 ? Math.max(...list) : 0;
  const intro = maxStreak >= 30 ? `Tenés una racha de ${maxStreak} días que vale proteger. ` :
                maxStreak >= 7 ? `Tu racha de ${maxStreak} días está creciendo. ` : '';
  return intro + pick([
    'Para proteger una racha: dejá listo el entorno la noche anterior. Cero decisiones en el momento.',
    'Streak freeze automático ya tenés (2/mes). Úsalo si una semana es imposible — no es trampa, es estrategia.',
    'No rompas 2 días seguidos. 1 es accidente, 2 es nuevo patrón. Esa línea es la real.',
    'Si vas a viajar/cambio de rutina: bajá la barra del hábito esos días. "Leer 1 minuto" cuenta.',
  ]);
}

function restartFromFail(): string {
  return pick([
    'Caerse es parte. Lo que define el hábito es lo que hacés AL DÍA SIGUIENTE de caer. No el día que cumplís.',
    'No empieces "desde mañana". Empezá HOY, ahora, con la versión más chiquita del hábito posible.',
    'Si rompiste la racha, no la "recuperes". Hacé hoy lo mismo que harías si la racha siguiera viva. Después de un mes te olvidás del fallo.',
    'Vergüenza por fallar = más fallo (what-the-hell effect). No te culpes. Solo volvé.',
    'Truco de J. Clear: "nunca fallés dos veces". Una vez es human, dos veces se vuelve hábito malo.',
  ]);
}

function lowFrictionTip(): string {
  return pick([
    'Hacé el hábito 20 segundos más fácil. Botella llena, app abierta, ropa lista la noche anterior.',
    'Regla 2 minutos: la versión más chiquita del hábito tiene que durar ≤2 min. "Meditar 10 min" → "meditar 1 minuto".',
    'Sacá decisiones del medio. Si dudas "lo hago ahora o más tarde?" — ya perdiste.',
    'Hábito atado a otro: "después de cepillarme los dientes, hago 5 sentadillas". El cue ya está.',
  ]);
}

function mondayBlues(): string {
  return pick([
    'Los lunes son duros porque el cerebro se acostumbró al modo finde. Plan: el domingo a la noche, dejá listas 3 cosas chiquitas para lunes (ropa, primer hábito, mate listo).',
    'Lunes = peor día estadísticamente en hábitos. No es vos, es universal. La mejor jugada: bajá la barra el lunes.',
    'En vez de "qué tengo que hacer", preguntate "qué es lo MÁS chiquito que igual cuenta". Y hacé eso.',
    'Lunes regla: solo UN hábito el lunes. Si lo cumplís, ganaste el día.',
  ]);
}

function morningRoutineTip(): string {
  return pick([
    'Las mañanas tienen la voluntad más fresca del día. Poné ahí lo más difícil/importante.',
    'No mires el celular antes de hacer el primer hábito. El scroll secuestra la voluntad.',
    'Hábitos de mañana: tienen que arrancar EN AUTOMÁTICO. Cero decisión. Café → app → check.',
    'Stack matinal: 5 min de movimiento + agua + planear el día. 15 min total, transforma el resto.',
  ]);
}

function eveningRoutineTip(): string {
  return pick([
    'Rutina de noche: prepará el cue del hábito de mañana ANTES de dormir. Ropa, libro, app.',
    'Sin pantallas 1 hora antes de dormir (NSF). Si no podés tanto, intentá 30 min.',
    'Journaling de 5 min cierra el día. Lally et al.: reflexión = más adherencia al día siguiente.',
    'Acostarse a la misma hora es más importante que dormir 8 hs perfectos. Constancia > duración.',
  ]);
}

function identityResponse(data: AppData): string {
  if (!data.identity) return 'No elegiste una identidad todavía. Editá uno de tus hábitos y revisá el flow inicial. Cambia el juego.';
  return pick([
    `Elegiste ser "${data.identity}". Recordá: los hábitos son votos a esa identidad. Cada check es un voto.`,
    `"${data.identity}" — eso es lo que estás construyendo. ¿Lo que hiciste hoy refuerza esa identidad?`,
    `Tu yo en construcción: ${data.identity}. Decisión simple para hoy: ¿qué haría hoy alguien que YA ES "${data.identity}"?`,
  ]);
}

function motivateMe(data: AppData): string {
  const list = data.habits.map(h => currentStreak(h, data.completions, new Date(), data.freezesUsed));
  const maxStreak = list.length > 0 ? Math.max(...list) : 0;
  if (maxStreak >= 30) return `Tenés una racha de ${maxStreak} días. Esa es la prueba de que podés. Hoy es uno más, no hay misterio.`;
  if (maxStreak >= 7) return `${maxStreak} días seguidos en algo. Ya no es voluntad, es identidad emergente. No la rompas hoy.`;
  return pick([
    'Vos no tenés que ser otra persona. Tenés que ser la misma persona que hizo esto ayer.',
    'No es "tener ganas". Es hacer aunque no tengas ganas. Después llegan las ganas.',
    'Hoy un voto. Solo eso. No pienses en mañana.',
    'La diferencia entre el que lo logra y el que no, no es talento — es la persona que vuelve después de fallar.',
  ]);
}

function demotivated(data: AppData): string {
  return pick([
    'Te entiendo. A veces lo único que toca es bajar la barra al mínimo. Hoy: hacé UNO solo, en su versión más chiquita.',
    'Estar agotado no es debilidad — es señal. Quizás tenés demasiados hábitos para tu energía actual. Reducí a 2 los más importantes.',
    'No es vos, es el sistema. Si querés, charlamos: ¿cuál hábito está pesando más?',
    'Día de mierda: válido. La regla es "no rompas 2 días seguidos". Hoy descansá, mañana volvé chiquito.',
    `Tu mejor racha es prueba de que podés (vos tenés ${Math.max(...data.habits.map(h => bestStreak(h, data.completions)), 0)} días en algún momento). No se evaporó. Está latente.`,
  ]);
}

function celebrateResponse(): string {
  return pick([
    '¡Qué genial! 🐼✨ Un check más es identidad construida. Disfrutalo.',
    'Excelente. No subestimes esos pequeños wins — son la materia prima de los grandes.',
    '¡Vamos! Lo difícil ya lo hiciste: empezar.',
    'Eso es. Otro voto a la persona que querés ser.',
    'Lo registraste. Eso vale más que el hábito en sí — porque te enseña que SÍ podés.',
  ]);
}

function nextGoalResponse(data: AppData): string {
  const today = new Date();
  const closest = data.habits.map(h => {
    let done = 0;
    for (const [k, day] of Object.entries(data.completions)) {
      if (!day[h.id]?.done) continue;
      const d = parseDateKey(k);
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) done++;
    }
    const expected = expectedDaysInMonth(h.frequency, today.getFullYear(), today.getMonth());
    const target = Math.min(h.monthlyGoal, expected);
    return { h, done, target, remaining: Math.max(0, target - done) };
  }).filter(x => x.remaining > 0).sort((a, b) => a.remaining - b.remaining);
  if (closest.length === 0) return '¡Cumpliste todas tus metas del mes! Hora de respirar — o subir una meta para el mes que viene.';
  const top = closest[0];
  return `Lo más cerca: "${top.h.name}" — te quedan ${top.remaining} ${top.remaining === 1 ? 'día' : 'días'} para llegar a la meta (${top.done}/${top.target}). Muy cumplible.`;
}

function monthlyProjection(data: AppData): string {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  const daysLeft = daysInMonth - daysPassed;
  const projection = data.habits.map(h => {
    let done = 0;
    for (const [k, day] of Object.entries(data.completions)) {
      if (!day[h.id]?.done) continue;
      const d = parseDateKey(k);
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) done++;
    }
    // proyección lineal basada en rate actual
    const rate = daysPassed > 0 ? done / daysPassed : 0;
    const projected = Math.round(done + rate * daysLeft);
    return { h, done, projected, target: h.monthlyGoal };
  });
  const willMakeIt = projection.filter(p => p.projected >= p.target);
  const willMiss = projection.filter(p => p.projected < p.target);
  const lines: string[] = [];
  lines.push(`Faltan ${daysLeft} días para cerrar el mes. Proyección:`);
  for (const p of willMakeIt.slice(0, 3)) lines.push(`✓ "${p.h.name}" llegará a meta (~${p.projected}/${p.target})`);
  for (const p of willMiss.slice(0, 3)) lines.push(`✗ "${p.h.name}" quedará en ~${p.projected}/${p.target}`);
  return lines.join('\n');
}

function readyForMore(data: AppData): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  let totalRate = 0, n = 0;
  for (const h of data.habits) {
    let exp = 0, done = 0;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    if (exp > 0) { totalRate += done / exp; n++; }
  }
  const avg = n > 0 ? totalRate / n : 0;
  const habitsCount = data.habits.length;
  if (habitsCount >= 8) return `Ya tenés ${habitsCount} hábitos. Más es contraproducente — la literatura aplicada (cognitive load) sugiere ≤5 activos. Quizás conviene consolidar antes de sumar.`;
  if (avg >= 0.8 && habitsCount < 6) return `Vas al ${Math.round(avg * 100)}% promedio con ${habitsCount} hábitos. Estás listo para sumar uno más. Empezá chiquito.`;
  if (avg < 0.5) return `Vas al ${Math.round(avg * 100)}% promedio. Antes de sumar, consolidá los que tenés. Más hábitos no resuelven adherencia baja.`;
  return `Vas al ${Math.round(avg * 100)}%. Estás en zona media — si querés sumar, hacelo, pero apuntá a algo muy fácil y compatible (habit stacking).`;
}

function habitSuggestion(data: AppData): string {
  const existing = data.habits.map(h => h.name.toLowerCase());
  const gaps: Array<{ cat: string; suggest: string; why: string }> = [];
  if (!existing.some(n => /agua|hidrata/.test(n))) gaps.push({ cat: 'Salud física', suggest: 'Tomar 2L de agua', why: 'EFSA: ~2L base diaria. Hábito ancla típico.' });
  if (!existing.some(n => /caminar|correr|entrena|gym|movimiento/.test(n))) gaps.push({ cat: 'Salud física', suggest: 'Caminar 30 min', why: 'WHO: 150 min/sem moderado. Keystone habit (Duhigg).' });
  if (!existing.some(n => /medit|respira|mindful/.test(n))) gaps.push({ cat: 'Salud mental', suggest: 'Meditar 10 min', why: 'Evidencia NIH para regulación emocional.' });
  if (!existing.some(n => /leer|lectura|libro/.test(n))) gaps.push({ cat: 'Aprendizaje', suggest: 'Leer 20 min', why: 'Cognitive reserve + bajada de estrés.' });
  if (!existing.some(n => /gratitud|agradecer/.test(n))) gaps.push({ cat: 'Salud mental', suggest: 'Gratitud diaria', why: 'Emmons & McCullough (2003): mejora bienestar subjetivo.' });
  if (!existing.some(n => /planear|planeo|plan/.test(n))) gaps.push({ cat: 'Productividad', suggest: 'Planear el día siguiente', why: 'Implementation intentions (Gollwitzer): el efecto más potente en behavior change.' });
  if (!existing.some(n => /tender|cama/.test(n))) gaps.push({ cat: 'Vida', suggest: 'Tender la cama', why: 'Keystone habit pequeño con efecto disparador (Admiral McRaven, Duhigg).' });
  if (gaps.length === 0) return 'Tu mix está bastante completo. Hablemos de profundizar en los que tenés en vez de sumar.';
  const pick1 = gaps[0];
  return `Te falta algo en "${pick1.cat}". Sugerencia: ${pick1.suggest}. ¿Por qué? ${pick1.why}`;
}

function daysToForm(): string {
  return 'Mediana real para automatizar un hábito: 66 días (Lally et al., UCL 2010). Rango individual: 18 a 254 días. El mito de los 21 días es eso, mito. Sé paciente — la diferencia entre el día 30 y el 66 es enorme: del esfuerzo consciente al automatismo.';
}

function journalReview(data: AppData): string {
  const notes: Array<{ date: string; habit: string; note: string }> = [];
  for (const [k, day] of Object.entries(data.completions)) {
    for (const [habitId, entry] of Object.entries(day)) {
      if (entry.note) {
        const h = data.habits.find(hh => hh.id === habitId);
        if (h) notes.push({ date: k, habit: h.name, note: entry.note });
      }
    }
  }
  if (notes.length === 0) return 'Aún no escribiste ninguna nota. Tocá el botón "＋" al lado de un hábito cualquier día para empezar.';
  notes.sort((a, b) => b.date.localeCompare(a.date));
  const recent = notes.slice(0, 3);
  return `Últimas ${recent.length} ${recent.length === 1 ? 'nota' : 'notas'}:\n${recent.map(n => `• ${n.date} (${n.habit}): "${n.note.slice(0, 80)}${n.note.length > 80 ? '…' : ''}"`).join('\n')}`;
}

function fallbackResponse(data: AppData): string {
  // En vez de "no te entendí", devolvemos algo ÚTIL: un dato REAL de tus datos
  // + preguntas concretas usando los nombres de TUS hábitos. Se siente menos
  // "tonto" y guía hacia lo que el Coach sí sabe responder.
  const insight = detectPatterns(data)[0]?.text;

  // Hábito con mejor racha activa (para sugerir algo concreto y positivo)
  const withStreak = data.habits
    .map(h => ({ h, s: currentStreak(h, data.completions, new Date(), data.freezesUsed) }))
    .sort((a, b) => b.s - a.s)[0];

  // Hábito más flojo del mes (para sugerir foco)
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weakest = data.habits
    .map(h => {
      let exp = 0, done = 0;
      for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
        if (!isExpectedToday(h, d, data.completions)) continue;
        exp++;
        if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
      }
      return { h, rate: exp > 0 ? done / exp : 1 };
    })
    .sort((a, b) => a.rate - b.rate)[0];

  // Construir sugerencias concretas con nombres reales
  const suggestions: string[] = [];
  if (weakest && weakest.rate < 0.7) suggestions.push(`"¿por qué me cuesta ${weakest.h.name}?"`);
  if (withStreak && withStreak.s > 0) suggestions.push(`"¿cómo voy con ${withStreak.h.name}?"`);
  suggestions.push('"¿cómo voy este mes?"', '"dame un consejo"', '"¿qué tengo hoy?"');

  const lead = insight
    ? `No estoy seguro de qué me preguntaste, pero mirando tus datos: ${insight}`
    : `No estoy seguro de qué me preguntaste — capaz lo pueda decir distinto.`;

  return `${lead}\n\nProbá con algo así: ${suggestions.slice(0, 3).join(' · ')}`;
}

// ============ Nuevos composers 2.1 ============

function yesterdayResponse(data: AppData): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const k = dateKey(yesterday);
  const day = data.completions[k] ?? {};
  const expected = data.habits.filter(h => isExpectedToday(h, yesterday, data.completions));
  if (expected.length === 0) return 'Ayer no te tocaba nada (sin hábitos esperados ese día).';
  const done = expected.filter(h => day[h.id]?.done);
  const missing = expected.filter(h => !day[h.id]?.done);
  if (done.length === expected.length) {
    return `Ayer fue **día perfecto** 🌟 — cumpliste los ${expected.length}. Aprovechá esa inercia hoy.`;
  }
  if (done.length === 0) {
    return `Ayer no marcaste nada (${expected.length} esperados). Pasa. Lo importante: hoy volver chiquito a uno.`;
  }
  const rate = Math.round((done.length / expected.length) * 100);
  const doneNames = done.slice(0, 3).map(h => `"${h.name}"`).join(', ');
  const missNames = missing.slice(0, 2).map(h => `"${h.name}"`).join(', ');
  return `Ayer cumpliste **${done.length}/${expected.length}** (${rate}%). Hechos: ${doneNames}. Faltó: ${missNames}.`;
}

function timeSinceResponse(data: AppData, habit?: Habit): string {
  const target = habit ?? mostAbandonedHabit(data);
  if (!target) return 'Necesito saber de qué hábito hablás. Probá: "hace cuánto que no [nombre del hábito]".';
  const today = new Date();
  let lastDone: Date | null = null;
  for (const [k, day] of Object.entries(data.completions)) {
    if (!day[target.id]?.done) continue;
    const d = parseDateKey(k);
    if (!lastDone || d > lastDone) lastDone = d;
  }
  if (!lastDone) return `Nunca marcaste "${target.name}" todavía. ¿Empezamos hoy?`;
  const days = Math.floor((today.getTime() - lastDone.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return `Hoy marcaste "${target.name}" ✓`;
  if (days === 1) return `"${target.name}" — última vez ayer. Estás al día.`;
  if (days <= 3) return `"${target.name}" — hace ${days} días que no. Todavía cerca.`;
  if (days <= 14) return `"${target.name}" — hace ${days} días que no. Buen momento para volver con la versión chiquita.`;
  if (days <= 60) return `"${target.name}" — hace ${days} días que no. La identidad se enfría. ¿Lo querés recuperar o sacar?`;
  return `"${target.name}" — hace ${days} días que no. Honestamente, capaz que ya no es para esta etapa. Pensalo.`;
}

function mostAbandonedHabit(data: AppData): Habit | undefined {
  const today = new Date();
  let worst: { h: Habit; days: number } | null = null;
  for (const h of data.habits) {
    let lastDone: Date | null = null;
    for (const [k, day] of Object.entries(data.completions)) {
      if (!day[h.id]?.done) continue;
      const d = parseDateKey(k);
      if (!lastDone || d > lastDone) lastDone = d;
    }
    const days = lastDone ? Math.floor((today.getTime() - lastDone.getTime()) / (24 * 60 * 60 * 1000)) : 9999;
    if (!worst || days > worst.days) worst = { h, days };
  }
  return worst?.h;
}

function compareHabits(data: AppData, q: string): string {
  // Intentar identificar 2 hábitos mencionados
  const qn = normalize(q);
  const mentioned: Habit[] = [];
  for (const h of data.habits) {
    const hn = normalize(h.name);
    const firstWord = hn.split(/\s+/).filter(w => w.length > 3)[0];
    if (qn.includes(hn) || (firstWord && new RegExp(`\\b${escapeRegex(firstWord)}\\b`).test(qn))) {
      mentioned.push(h);
    }
  }
  if (mentioned.length < 2) {
    return 'Necesito 2 hábitos para comparar. Probá: "compará leer con meditar" (o los nombres que tengas).';
  }
  const [a, b] = mentioned.slice(0, 2);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  function rateFor(h: Habit): number {
    let exp = 0, done = 0;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    return exp > 0 ? done / exp : 0;
  }
  const ra = Math.round(rateFor(a) * 100);
  const rb = Math.round(rateFor(b) * 100);
  const sa = currentStreak(a, data.completions, today, data.freezesUsed);
  const sb = currentStreak(b, data.completions, today, data.freezesUsed);
  const lines: string[] = [];
  lines.push(`**"${a.name}"**: ${ra}% este mes · racha ${sa}`);
  lines.push(`**"${b.name}"**: ${rb}% este mes · racha ${sb}`);
  if (ra > rb + 10) lines.push(`\n"${a.name}" va mejor. Quizás el cue o el momento del día funciona mejor para ese.`);
  else if (rb > ra + 10) lines.push(`\n"${b.name}" va mejor. Estudiá qué tiene diferente del otro.`);
  else lines.push('\nParejos. Estás aplicando un sistema consistente entre los dos.');
  return lines.join('\n');
}

function todayOutlook(data: AppData): string {
  const today = new Date();
  const expected = data.habits.filter(h => isExpectedToday(h, today, data.completions));
  if (expected.length === 0) return 'Hoy no te toca nada — día libre. Aprovechá para descansar o leer un rato.';
  const done = expected.filter(h => data.completions[dateKey(today)]?.[h.id]?.done);
  const remaining = expected.filter(h => !data.completions[dateKey(today)]?.[h.id]?.done);
  if (remaining.length === 0) return `Hoy ya completaste los ${expected.length} hábitos del día. **Día perfecto** 🌟`;

  const hour = today.getHours();
  const intro = hour < 11 ? 'Hoy te tocan' :
                hour < 17 ? 'Te quedan' :
                hour < 21 ? 'Te quedan para hoy' :
                'Antes de dormir te quedan';
  const list = remaining.slice(0, 5).map(h => `• ${h.emoji ?? ''} ${h.name}`).join('\n');
  return `${intro} **${remaining.length}** ${remaining.length === 1 ? 'hábito' : 'hábitos'} (ya hiciste ${done.length}):\n${list}`;
}

function sufficientEval(data: AppData): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  let totalRate = 0, n = 0;
  for (const h of data.habits) {
    let exp = 0, done = 0;
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    if (exp > 0) { totalRate += done / exp; n++; }
  }
  const avg = n > 0 ? totalRate / n : 0;
  if (avg >= 0.9) return `Honestamente: estás haciendo de más, casi. ${Math.round(avg * 100)}% promedio. Cuidate de no entrar en perfeccionismo — descansar también es parte.`;
  if (avg >= 0.75) return `Sí, ${Math.round(avg * 100)}% promedio es **muy sólido**. No estás "ahorrando para mejor mes", esto YA es ese mes.`;
  if (avg >= 0.5) return `${Math.round(avg * 100)}% promedio — vas bien pero no es zona de identidad consolidada. Apuntá a ${Math.round(avg * 100) + 15}% el mes que viene.`;
  return `${Math.round(avg * 100)}% promedio. Honestamente: no es suficiente para que se vuelva automático. Pero la fórmula no es "esforzate más" — es "bajá la barra y sumá frecuencia".`;
}

export function dailyBrief(data: AppData): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yk = dateKey(yesterday);

  // Linea 1: ayer
  const yExpected = data.habits.filter(h => isExpectedToday(h, yesterday, data.completions));
  const yDone = yExpected.filter(h => data.completions[yk]?.[h.id]?.done).length;
  const yLine = yExpected.length === 0 ? '' :
    yDone === yExpected.length ? `**Ayer**: día perfecto 🌟 (${yDone}/${yExpected.length}). ` :
    yDone === 0 ? `**Ayer**: 0/${yExpected.length}. Hoy es nuevo. ` :
    `**Ayer**: ${yDone}/${yExpected.length}. `;

  // Linea 2: hoy
  const tExpected = data.habits.filter(h => isExpectedToday(h, today, data.completions));
  const tDone = tExpected.filter(h => data.completions[dateKey(today)]?.[h.id]?.done).length;
  const tLine = tExpected.length === 0 ? '**Hoy**: día libre.' :
    tDone === tExpected.length ? `**Hoy**: ya cumpliste los ${tExpected.length} 🌟` :
    `**Hoy**: ${tDone}/${tExpected.length} hasta ahora.`;

  // Linea 3: focus del día (hábito más importante hoy)
  const remaining = tExpected.filter(h => !data.completions[dateKey(today)]?.[h.id]?.done);
  const focus = remaining.find(h => {
    const s = currentStreak(h, data.completions, today, data.freezesUsed);
    return s >= 3;
  }) ?? remaining[0];

  let focusLine = '';
  if (focus) {
    const s = currentStreak(focus, data.completions, today, data.freezesUsed);
    if (s >= 7) focusLine = `\n**Foco**: "${focus.name}" — racha de ${s} días, no la rompas.`;
    else if (s >= 3) focusLine = `\n**Foco**: "${focus.name}" — ${s} días seguidos, construyendo momentum.`;
    else focusLine = `\n**Foco**: ${focus.emoji ?? ''} "${focus.name}" como anclaje del día.`;
  }

  return yLine + tLine + focusLine;
}

// ============ Proactive insight ============

export function proactiveInsight(data: AppData): string | null {
  if (data.habits.length === 0) return null;
  const today = new Date();
  const hour = today.getHours();

  // PRIORIDAD 1 — STREAK AT RISK: racha activa ≥7 días + hábito esperado hoy + no marcado + tarde
  if (hour >= 18) {
    for (const h of data.habits) {
      if (!isExpectedToday(h, today, data.completions)) continue;
      if (data.completions[dateKey(today)]?.[h.id]?.done) continue;
      const s = currentStreak(h, data.completions, today, data.freezesUsed);
      if (s >= 7) {
        return `⚠️ Tu racha de **${s} días** en "${h.name}" está en juego. Quedan ${24 - hour}h del día. Si está muy difícil, hacé la versión chiquita (2 minutos).`;
      }
    }
  }

  // Domingo a la noche → invitar a revisar la semana
  if (today.getDay() === 0 && hour >= 18) {
    return '🐼 Domingo a la noche — ¿revisamos cómo fue la semana? Tocá "Mi progreso" → "¿Cómo va mi semana?"';
  }
  // Lunes a la mañana → motivar
  if (today.getDay() === 1 && hour < 12) {
    return '🐼 Lunes a la mañana. Regla simple: empezá con UN hábito hoy, el más fácil. Si lo cumplís, ganaste el lunes.';
  }
  // Viernes a la mañana → motivar para cerrar la semana
  if (today.getDay() === 5 && hour < 12) {
    return '🐼 Viernes — un empuje más para cerrar la semana fuerte. Los hábitos del finde son los más difíciles, prepará el contexto desde ya.';
  }
  // Racha milestone (cada 10 días arriba de 30)
  for (const h of data.habits) {
    const s = currentStreak(h, data.completions, today, data.freezesUsed);
    if (s >= 30 && s % 10 === 0) {
      return `🔥 Tu racha de **${s} días** en "${h.name}" es para celebrar. Estás en zona de identidad construida.`;
    }
    if (s === 66) {
      return `🌳 **66 días** en "${h.name}" — la mediana real para automatizar un hábito (Lally 2010). YA es parte de vos.`;
    }
  }
  // Hábito abandonado entre 14 y 30 días
  for (const h of data.habits) {
    let lastDone: Date | null = null;
    for (const [k, day] of Object.entries(data.completions)) {
      if (day[h.id]?.done) {
        const d = parseDateKey(k);
        if (!lastDone || d > lastDone) lastDone = d;
      }
    }
    if (lastDone) {
      const days = Math.floor((today.getTime() - lastDone.getTime()) / (24 * 60 * 60 * 1000));
      if (days >= 14 && days <= 30) {
        return `Hace **${days} días** que no tocás "${h.name}". ¿Hablamos? Capaz no es el momento, o solo cambió el cue.`;
      }
    }
  }
  // Patterns insight si hay
  const patterns = detectPatterns(data);
  if (patterns.length > 0) {
    return `🐼 Noté esto: ${patterns[0].text}`;
  }
  // Si nada interesante → mensaje de bienvenida con dato chiquito
  const totalChecks = Object.values(data.completions).reduce((sum, day) => sum + Object.values(day).filter(e => e.done).length, 0);
  if (totalChecks > 0) {
    return `🐼 Llevás **${totalChecks.toLocaleString('es-AR')} checks totales**. Hoy es un voto más. ¿Charlamos?`;
  }
  return null;
}

// ============ Follow-up suggestions ============

export function followUpSuggestions(intent: Intent, _data: AppData): string[] {
  switch (intent) {
    case 'monthly_review':
      return ['¿Cuál necesita más atención?', 'Proyectame cómo termino el mes', 'Dame un tip para mejorar'];
    case 'weekly_review':
      return ['¿Qué día fallo más?', '¿Cómo voy este mes?', 'Dame un consejo'];
    case 'weekday_pattern':
      return ['Tip para mis días flojos', '¿Y por momento del día?', '¿Cuál es mi mejor hábito?'];
    case 'best_habit':
      return ['Tip para mantener la racha', '¿Y el peor?', '¿Cuál abandoné?'];
    case 'weakest_habit':
      return ['Tip para bajar la fricción', '¿Por qué fallo ahí?', 'Dame motivación'];
    case 'streak':
      return ['Tip para mantenerla', '¿Cuándo se forma el hábito?', 'Proyectame el mes'];
    case 'tip':
      return ['Otro consejo', '¿Cómo bajo la fricción?', 'Estoy desmotivado'];
    case 'demotivated':
      return ['Motivame', 'Dame un tip de recuperación', '¿Quién soy en hábitos?'];
    case 'identity':
      return ['Motivame', '¿Cuál es mi mejor hábito?', '¿Estoy listo para sumar otro?'];
    case 'next_goal':
      return ['Proyectame el mes', '¿Cuántos días perfectos?', 'Tip para mantener'];
    case 'specific_habit':
      return ['Análisis a fondo', '¿Cómo va este mes en general?', 'Tip para este'];
    case 'monthly_projection':
      return ['Tip para acelerar', '¿Cuál llego?', '¿Estoy listo para sumar?'];
    case 'habit_suggestion':
      return ['¿Estoy listo para sumar?', 'Tip para arrancar uno nuevo', '¿Cuándo se forma?'];
    case 'yesterday':
      return ['¿Cómo voy este mes?', '¿Qué tengo hoy?', 'Dame un consejo'];
    case 'time_since':
      return ['¿Cómo arranco después de fallar?', 'Tip para bajar la fricción', '¿Cuál abandoné más?'];
    case 'compare_habits':
      return ['¿Qué hábito es mi mejor?', 'Tip de habit stacking', '¿Qué patrón hay?'];
    case 'today_outlook':
      return ['Dame un consejo', 'Motivame', '¿Cómo voy este mes?'];
    case 'sufficient_eval':
      return ['¿Cómo voy este mes?', 'Tip para mantener la racha', '¿Estoy listo para sumar?'];
    case 'daily_brief':
      return ['¿Qué tengo hoy?', 'Dame un consejo', 'Motivame'];
    case 'motivate_me':
      // 'demotivated' ya se maneja arriba (su propio case); no duplicar acá.
      return ['Dame un tip de recuperación', '¿Quién soy en hábitos?', '¿Cuál es mi mejor racha?'];
    default:
      return ['¿Cómo voy este mes?', 'Dame un consejo', '¿Qué día fallo más?'];
  }
}

// ============ API pública ============

export interface CoachResult {
  text: string;
  followUps: string[];
  intent: Intent;
}

export function getCoachResult(question: string, data: AppData, recentIntents: Intent[] = []): CoachResult {
  if (data.habits.length === 0) {
    return {
      text: 'Todavía no tenés hábitos. Andá a la pestaña Hábitos y agregá tu primero — después podemos charlar.',
      followUps: [],
      intent: 'fallback',
    };
  }
  const cls = classify(question, data.habits);
  cls.originalQuestion = question;
  let text = compose(cls, data);

  // Memoria light: si ya tocamos el mismo intent recientemente, agregar disclaimer
  if (recentIntents.length >= 2 && recentIntents.slice(-2).every(i => i === cls.intent)) {
    text = `(De vuelta sobre lo mismo, te lo digo distinto:)\n\n${text}`;
  }

  // Sentiment modulation: si user con mood bajo y respuesta NO es demotivated → suavizar
  if (cls.mood === 'low' && cls.intent !== 'demotivated' && cls.intent !== 'celebrate') {
    text = `Te leo cansado, así que primero te lo digo directo: está OK no estar al 100%.\n\n${text}`;
  }

  const followUps = followUpSuggestions(cls.intent, data);

  return { text, followUps, intent: cls.intent };
}

function compose(cls: Classification, data: AppData): string {
  switch (cls.intent) {
    case 'greet': return greetResponse(data);
    case 'thanks': return thanksResponse();
    case 'capabilities': return capabilitiesResponse(data);
    case 'monthly_review': return monthlyReview(data);
    case 'weekly_review': return weeklyReview(data);
    case 'year_review': return yearReview(data);
    case 'perfect_days_count': return perfectDaysCount(data);
    case 'total_completions': return totalCompletions(data);
    case 'weekday_pattern': return weekdayPatternResponse(data);
    case 'time_of_day_analysis': return timeOfDayAnalysis(data);
    case 'habit_correlations': return habitCorrelations(data);
    case 'weekend_vs_weekday': return weekendVsWeekday(data);
    case 'best_habit': return bestHabitResponse(data);
    case 'weakest_habit': return weakestHabitResponse(data);
    case 'streak': return streakResponse(data);
    case 'specific_habit': return cls.habit ? specificHabitResponse(data, cls.habit) : fallbackResponse(data);
    case 'abandoned_habit': return abandonedHabit(data);
    case 'habit_breakdown': return habitBreakdown(data, cls.habit);
    case 'tip': return tipResponse(data);
    case 'streak_protection_tip': return streakProtectionTip(data);
    case 'restart_from_fail': return restartFromFail();
    case 'low_friction_tip': return lowFrictionTip();
    case 'monday_blues': return mondayBlues();
    case 'morning_routine_tip': return morningRoutineTip();
    case 'evening_routine_tip': return eveningRoutineTip();
    case 'next_goal': return nextGoalResponse(data);
    case 'monthly_projection': return monthlyProjection(data);
    case 'ready_for_more': return readyForMore(data);
    case 'habit_suggestion': return habitSuggestion(data);
    case 'days_to_form': return daysToForm();
    case 'identity': return identityResponse(data);
    case 'motivate_me': return motivateMe(data);
    case 'demotivated': return demotivated(data);
    case 'celebrate': return celebrateResponse();
    case 'journal_review': return journalReview(data);
    // 2.1
    case 'yesterday': return yesterdayResponse(data);
    case 'time_since': return timeSinceResponse(data, cls.habit);
    case 'compare_habits': return compareHabits(data, cls.originalQuestion ?? '');
    case 'today_outlook': return todayOutlook(data);
    case 'sufficient_eval': return sufficientEval(data);
    case 'daily_brief': return dailyBrief(data);
    default: return fallbackResponse(data);
  }
}

// Backwards compatibility con la versión simple
export function getCoachResponse(question: string, data: AppData): string {
  return getCoachResult(question, data).text;
}

// ============ Suggestion catalog (36 questions, 6 categories) ============

export interface SuggestionCategory {
  id: string;
  emoji: string;
  label: string;
  questions: string[];
}

export const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    id: 'progreso',
    emoji: '📊',
    label: 'Mi progreso',
    questions: [
      'Dame mi resumen del día',
      '¿Cómo me fue ayer?',
      '¿Cómo voy este mes?',
      '¿Cómo va mi semana?',
      '¿Cuántos días perfectos llevo?',
      '¿Cuántos hábitos completé en total?',
      'Mostrame mis números del año',
      'Proyectame cómo termino el mes',
      '¿Hago suficiente?',
    ],
  },
  {
    id: 'patrones',
    emoji: '🔍',
    label: 'Patrones',
    questions: [
      '¿Qué día fallo más?',
      '¿Soy más constante de mañana o de noche?',
      '¿Qué hábitos van juntos?',
      '¿Me cuesta más los fines de semana?',
      '¿Qué patrón ves en mi semana?',
      'Mostrame las correlaciones',
    ],
  },
  {
    id: 'habitos',
    emoji: '💪',
    label: 'Sobre mis hábitos',
    questions: [
      '¿Qué tengo hoy?',
      '¿Cuál es mi mejor hábito?',
      '¿Cuál necesita más atención?',
      '¿Cuál es mi racha más larga ahora?',
      '¿Cuál estoy abandonando?',
      '¿Hace cuánto que no?',
      'Comparame dos hábitos',
      'Analizame mi hábito principal',
      'Leeme mis notas',
    ],
  },
  {
    id: 'consejos',
    emoji: '💡',
    label: 'Consejos',
    questions: [
      'Dame un consejo',
      'Tip para mantener la racha',
      '¿Cómo arranco después de fallar?',
      'Tip para los lunes difíciles',
      '¿Cómo bajo la fricción?',
      'Consejo para mi rutina de mañana',
    ],
  },
  {
    id: 'metas',
    emoji: '🎯',
    label: 'Metas y futuro',
    questions: [
      '¿Cuánto falta para mi meta?',
      '¿Estoy listo para sumar otro hábito?',
      '¿Qué hábito me convendría sumar?',
      '¿Cuándo se forma un hábito?',
      'Proyectame el cierre del mes',
      '¿Cuál meta me queda más cerca?',
    ],
  },
  {
    id: 'vos',
    emoji: '🐼',
    label: 'Sobre vos',
    questions: [
      '¿Quién soy yo en hábitos?',
      'Recordame mi identidad',
      'Motivame',
      'Estoy desmotivado',
      'Dame un mensaje hoy',
      'Necesito energía',
    ],
  },
];
