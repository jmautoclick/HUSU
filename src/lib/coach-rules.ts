// HusuAI offline — motor de respuestas basado en reglas + datos del usuario.
// Sin necesidad de API key, funciona offline, gratis, infinito.
//
// Estrategia:
// 1. Clasificar la intención (greet / monthly_review / weekday_pattern / ...)
// 2. Sacar datos relevantes (patterns, streaks, recap)
// 3. Componer respuesta con plantilla + voseo + datos reales del usuario
// 4. Rotar plantillas para evitar repetición

import type { AppData, Habit } from './types';
import { detectPatterns } from './patterns';
import { bestStreak, currentStreak } from './streaks';
import { lastWeekRecap } from './recap';
import { isExpectedToday, expectedDaysInMonth } from './frequency';
import { dateKey, parseDateKey } from './dates';

type Intent =
  | 'greet'
  | 'monthly_review'
  | 'weekly_review'
  | 'weekday_pattern'
  | 'weakest_habit'
  | 'best_habit'
  | 'streak'
  | 'tip'
  | 'identity'
  | 'next_goal'
  | 'thanks'
  | 'specific_habit'
  | 'celebrate'
  | 'fallback';

interface Classification {
  intent: Intent;
  habit?: Habit;
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

function anyOf(text: string, words: string[]): boolean {
  return words.some(w => text.includes(w));
}

function classify(question: string, habits: Habit[]): Classification {
  const q = normalize(question);

  // Saludo simple
  if (anyOf(q, ['hola', 'que tal', 'buen dia', 'buenas', 'hey', 'hi ', 'hello'])) {
    return { intent: 'greet' };
  }

  // Gracias
  if (anyOf(q, ['gracias', 'mil gracias', 'genial', 'buenisimo', 'dale gracias'])) {
    return { intent: 'thanks' };
  }

  // ¿Cómo voy este mes?
  if (anyOf(q, ['como voy', 'como estoy', 'mi mes', 'progreso', 'como va el mes', 'este mes'])) {
    return { intent: 'monthly_review' };
  }

  // ¿Cómo va la semana?
  if (anyOf(q, ['semana', 'esta semana', 'mi semana'])) {
    return { intent: 'weekly_review' };
  }

  // Patrones por día de semana
  if (anyOf(q, ['que dia', 'dias que fallo', 'patron', 'patrones', 'dia de la semana', 'fallo mas'])) {
    return { intent: 'weekday_pattern' };
  }

  // Hábito que necesita atención
  if (anyOf(q, ['necesita atencion', 'cual estoy abandonando', 'peor habito', 'cual mejorar', 'mas atrasado', 'mas atrasada'])) {
    return { intent: 'weakest_habit' };
  }

  // Mejor hábito
  if (anyOf(q, ['mejor habito', 'mejor', 'top', 'destacado', 'cual va mejor'])) {
    return { intent: 'best_habit' };
  }

  // Racha
  if (anyOf(q, ['racha', 'seguido', 'dias seguidos', 'cuanto llevo'])) {
    return { intent: 'streak' };
  }

  // Consejo / motivación
  if (anyOf(q, ['consejo', 'tip', 'ayudame', 'motivame', 'que hago', 'idea', 'recomenda', 'sugeri'])) {
    return { intent: 'tip' };
  }

  // Identidad
  if (anyOf(q, ['quien soy', 'identidad', 'que tipo'])) {
    return { intent: 'identity' };
  }

  // Meta / progreso
  if (anyOf(q, ['meta', 'cuanto falta', 'cumplir', 'voy a cumplir', 'llego a la meta'])) {
    return { intent: 'next_goal' };
  }

  // Hábito específico mencionado por nombre (full, prefijo o primera palabra significativa)
  for (const h of habits) {
    const hName = normalize(h.name);
    if (q.includes(hName)) {
      return { intent: 'specific_habit', habit: h };
    }
    // primera palabra significativa (>3 chars, no stopword)
    const words = hName.split(/\s+/).filter(w => w.length > 3 && !['para', 'estar', 'estoy', 'minutos', 'minuto', 'dias', 'esta'].includes(w));
    for (const w of words) {
      // requiere que la palabra del hábito aparezca como token completo en la pregunta
      // (evita falsos positivos tipo "leer" matcheando "leído")
      if (new RegExp(`\\b${w}\\b`).test(q)) {
        return { intent: 'specific_habit', habit: h };
      }
    }
  }

  // Mención de hito / celebrar
  if (anyOf(q, ['logre', 'lo hice', 'cumpli', 'gane', 'logro'])) {
    return { intent: 'celebrate' };
  }

  return { intent: 'fallback' };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Composers (uno por intent) ----------

function greetResponse(data: AppData): string {
  const today = new Date();
  const hour = today.getHours();
  const timeGreet =
    hour < 12 ? 'Buen día' :
    hour < 19 ? 'Buenas tardes' :
    'Buenas noches';

  const greetings = [
    `${timeGreet}. ¿Querés que mire cómo venís este mes?`,
    `${timeGreet} 🐼 ¿En qué te puedo ayudar hoy?`,
    `Hola. Tenés ${data.habits.length} hábitos activos. ¿De cuál querés saber?`,
    `${timeGreet}. Probá preguntarme "cómo voy" o "qué consejo tenés".`,
  ];
  return pick(greetings);
}

function thanksResponse(): string {
  return pick([
    'Cuando quieras 🐼',
    'Dale, vos podés. Estoy acá.',
    'Tranqui, cuando necesites. Buena vibra.',
    'A vos. Seguimos.',
  ]);
}

function monthlyReview(data: AppData): string {
  const today = new Date();
  const monthName = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][today.getMonth()];

  let totalExpected = 0;
  let totalDone = 0;
  const perHabit: Array<{ h: Habit; done: number; expected: number; rate: number }> = [];

  for (const h of data.habits) {
    let exp = 0, done = 0;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    if (exp === 0) continue;
    perHabit.push({ h, done, expected: exp, rate: done / exp });
    totalExpected += exp;
    totalDone += done;
  }

  if (totalExpected === 0) {
    return 'Todavía no marcaste nada este mes. Empezá hoy con uno solo — la constancia gana a la cantidad.';
  }

  const overallRate = Math.round((totalDone / totalExpected) * 100);
  perHabit.sort((a, b) => b.rate - a.rate);
  const top = perHabit[0];
  const bottom = perHabit[perHabit.length - 1];

  const intro =
    overallRate >= 80 ? `Excelente mes. Vas ${overallRate}% en ${monthName}.` :
    overallRate >= 60 ? `Buen mes, ${overallRate}% en ${monthName}.` :
    overallRate >= 40 ? `Mes a medias, ${overallRate}% en ${monthName}. Es recuperable.` :
                        `Mes flojo, ${overallRate}% en ${monthName}. Sin culpa, vamos paso a paso.`;

  const topLine = top
    ? ` Lo mejor: "${top.h.name}" (${Math.round(top.rate * 100)}%).`
    : '';
  const bottomLine = (bottom && bottom !== top && bottom.rate < 0.6)
    ? ` Lo que más te cuesta: "${bottom.h.name}" (${Math.round(bottom.rate * 100)}%).`
    : '';

  return intro + topLine + bottomLine;
}

function weeklyReview(data: AppData): string {
  const recap = lastWeekRecap(data);
  if (recap.totalExpected === 0) {
    return 'Todavía no hay datos de la semana pasada. Marcá hoy uno para empezar.';
  }
  const rate = Math.round(recap.rate * 100);
  const perfectsLine = recap.perfectDays > 0 ? ` Tuviste ${recap.perfectDays} días perfectos.` : '';
  const topLine = recap.topStreakHabit
    ? ` Tu mejor racha activa: ${recap.topStreakHabit.streak} días en "${recap.topStreakHabit.habit.name}".`
    : '';
  return `La semana pasada cumpliste ${rate}% (${recap.totalDone}/${recap.totalExpected}).${perfectsLine}${topLine}`;
}

function weekdayPatternResponse(data: AppData): string {
  const patterns = detectPatterns(data);
  const weakDayInsight = patterns.find(p => /los \w+ cumple solo/.test(p.text));
  if (weakDayInsight) {
    return `${weakDayInsight.text} Mirá qué pasa esos días — ¿menos energía? ¿más distracciones? El cue importa más que la motivación.`;
  }

  // fallback manual: contar días
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0, 0, 0];
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
  if (valid.length < 2) {
    return 'Todavía no tengo suficientes datos para detectar patrones por día. Marcá unos días más y volvé.';
  }
  const worst = valid.reduce((min, r) => r.rate < min.rate ? r : min);
  const best = valid.reduce((max, r) => r.rate > max.rate ? r : max);
  if (best.rate - worst.rate < 0.15) {
    return 'Tu rendimiento es bastante parejo en toda la semana. Buena base — ahora podés empujar uno o dos hábitos más sin desbalancear el resto.';
  }
  return `Tu mejor día son los ${DOW_LABELS[best.day]} (${Math.round(best.rate * 100)}%), el peor los ${DOW_LABELS[worst.day]} (${Math.round(worst.rate * 100)}%). Idea: ese día más flojo, dejá listo el entorno la noche anterior.`;
}

function weakestHabitResponse(data: AppData): string {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const candidates = data.habits.map(h => {
    let exp = 0, done = 0;
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      if (!isExpectedToday(h, d, data.completions)) continue;
      exp++;
      if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
    }
    return { h, exp, done, rate: exp > 0 ? done / exp : -1 };
  }).filter(c => c.rate >= 0);

  if (candidates.length === 0) return 'No tenés datos este mes todavía. Empezá hoy con uno.';
  candidates.sort((a, b) => a.rate - b.rate);
  const worst = candidates[0];
  if (worst.rate >= 0.8) {
    return `Vas muy parejo — ninguno está abandonado. Lo más flojo es "${worst.h.name}" con ${Math.round(worst.rate * 100)}% y aún así es alto.`;
  }
  const suggestions = [
    `"${worst.h.name}" es el que más te cuesta (${Math.round(worst.rate * 100)}% este mes). Bajá la barra: hacelo aunque sea 2 minutos. Lo que importa es no romper la identidad.`,
    `Para "${worst.h.name}" (${Math.round(worst.rate * 100)}%), probá hacerlo justo después de un hábito que SÍ cumplís (habit stacking). El cue ya está consolidado.`,
    `"${worst.h.name}" se quedó atrás (${Math.round(worst.rate * 100)}%). Pregunta clave: ¿el momento del día asignado funciona, o lo tenés a una hora donde nunca tenés energía?`,
  ];
  return pick(suggestions);
}

function bestHabitResponse(data: AppData): string {
  const candidates = data.habits.map(h => ({
    h,
    streak: currentStreak(h, data.completions, new Date(), data.freezesUsed),
    best: bestStreak(h, data.completions),
  }));

  candidates.sort((a, b) => b.streak - a.streak || b.best - a.best);
  const top = candidates[0];
  if (!top || top.streak === 0) {
    return 'Ninguno tiene racha activa ahora. Lo importante es volver hoy, no ayer.';
  }
  return `"${top.h.name}" va al frente: ${top.streak} días de racha (tu mejor histórica: ${top.best}). Eso es identidad construida, no esfuerzo. Cuidalo.`;
}

function streakResponse(data: AppData): string {
  const list = data.habits.map(h => ({
    h,
    cur: currentStreak(h, data.completions, new Date(), data.freezesUsed),
  })).filter(x => x.cur > 0).sort((a, b) => b.cur - a.cur);

  if (list.length === 0) {
    return 'Por ahora no tenés rachas activas. Marcá hoy uno y arranca de nuevo — el día 1 vale igual que el día 100.';
  }

  if (list.length === 1) {
    const x = list[0];
    return `Tu única racha activa: ${x.cur} días en "${x.h.name}" 🔥`;
  }

  const top = list.slice(0, 3).map(x => `• "${x.h.name}": ${x.cur} días`).join('\n');
  return `Rachas activas:\n${top}`;
}

const TIPS = [
  'Identidad antes que acción. No digas "voy a leer", decí "soy alguien que lee". Cambia la pregunta interna.',
  'Regla de los 2 minutos (James Clear): si un hábito te cuesta arrancar, reducilo a algo que tarde 2 min. "Leer un libro" → "leer una página".',
  'Habit stacking: "después de X (que ya hago), voy a Y". Conecta el nuevo a un cue ya consolidado.',
  'La voluntad es agotable, el entorno no. Dejá la guitarra a la vista, las galletitas en el último cajón. El espacio te dirige.',
  'Mediana real para automatizar un hábito: 66 días (Lally et al., UCL 2010). No 21. Sé paciente con vos mismo.',
  'No rompas la cadena 2 días seguidos. 1 día es accidente, 2 es un nuevo patrón. Esa es la línea roja.',
  'Implementation intentions tienen el mejor effect size en behavior change (Gollwitzer, d=0.65): definí CUÁNDO y DÓNDE específicamente.',
  'Variable rewards funcionan mejor que predecibles. Variá el premio post-hábito — a veces música, a veces silencio, a veces algo dulce.',
  'Tu yo de mañana NO va a tener más voluntad que vos hoy. Decidí ahora, no más tarde.',
  'El día después de fallar es cuando se decide el hábito. No el día que lo hiciste bien.',
];

function tipResponse(data: AppData): string {
  // Si hay un pattern fuerte, devolverlo. Sino, tip random.
  const patterns = detectPatterns(data);
  if (patterns.length > 0 && Math.random() < 0.5) {
    return `Algo que noté: ${patterns[0].text} ${pick(['¿Tiene sentido?', 'Mirá si podés ajustar ahí.', 'Vale la pena observarlo.'])}`;
  }
  return pick(TIPS);
}

function identityResponse(data: AppData): string {
  if (!data.identity) {
    return 'No elegiste una identidad todavía. Andá a Hábitos → editar uno → revisá la pregunta inicial. Cambia el juego completo.';
  }
  return `Elegiste "${data.identity}". Recordá que los hábitos son votos a esa identidad. Cada check es un voto. ¿En qué te puedo ayudar para reforzarla?`;
}

function nextGoalResponse(data: AppData): string {
  const today = new Date();
  const closest = data.habits.map(h => {
    let monthDone = 0;
    for (const [k, day] of Object.entries(data.completions)) {
      if (!day[h.id]?.done) continue;
      const d = parseDateKey(k);
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) monthDone++;
    }
    const expected = expectedDaysInMonth(h.frequency, today.getFullYear(), today.getMonth());
    const target = Math.min(h.monthlyGoal, expected);
    return { h, monthDone, target, remaining: Math.max(0, target - monthDone) };
  }).filter(x => x.remaining > 0).sort((a, b) => a.remaining - b.remaining);

  if (closest.length === 0) {
    return '¡Cumpliste todas tus metas mensuales! Hora de respirar y disfrutar — o subir una meta para el mes que viene.';
  }
  const top = closest[0];
  return `Lo más cerca: "${top.h.name}" — te quedan ${top.remaining} días para llegar a la meta (${top.monthDone}/${top.target}). ¡Es muy cumplible!`;
}

function specificHabitResponse(data: AppData, h: Habit): string {
  const cur = currentStreak(h, data.completions, new Date(), data.freezesUsed);
  const best = bestStreak(h, data.completions);
  const today = new Date();
  let exp = 0, done = 0;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
    if (!isExpectedToday(h, d, data.completions)) continue;
    exp++;
    if (data.completions[dateKey(d)]?.[h.id]?.done) done++;
  }
  const rate = exp > 0 ? Math.round((done / exp) * 100) : 0;
  return `"${h.name}": ${done}/${exp} este mes (${rate}%). Racha actual: ${cur} días. Mejor racha histórica: ${best}.`;
}

function celebrateResponse(): string {
  return pick([
    '¡Qué genial! 🐼✨ Un check más es identidad construida. Disfrutá el momento.',
    'Excelente. No subestimes esos pequeños wins — son la materia prima de los grandes.',
    '¡Vamos! Lo difícil ya lo hiciste: empezar. Ahora seguir es solo no romper la cadena.',
  ]);
}

function fallbackResponse(data: AppData): string {
  const patterns = detectPatterns(data);
  const insight = patterns.length > 0 ? patterns[0].text : null;

  const generic = [
    'No estoy 100% seguro de qué me preguntás. Probá:\n• "¿Cómo voy este mes?"\n• "¿Qué hábito necesita más atención?"\n• "Dame un consejo"',
    'Mi capacidad es limitada por ahora. Pero puedo ayudarte con preguntas tipo "¿qué día fallo más?" o "¿cómo va mi semana?".',
    insight ? `No te entendí del todo, pero noté algo: ${insight}` : 'No te entendí del todo. Probá "consejo" o "mi mes" para empezar.',
  ].filter(Boolean) as string[];

  return pick(generic);
}

// ---------- API pública ----------

export function getCoachResponse(question: string, data: AppData): string {
  if (data.habits.length === 0) {
    return 'Todavía no tenés hábitos cargados. Andá a la pestaña Hábitos y agregá tu primero — después podemos charlar sobre tu progreso.';
  }

  const cls = classify(question, data.habits);

  switch (cls.intent) {
    case 'greet': return greetResponse(data);
    case 'thanks': return thanksResponse();
    case 'monthly_review': return monthlyReview(data);
    case 'weekly_review': return weeklyReview(data);
    case 'weekday_pattern': return weekdayPatternResponse(data);
    case 'weakest_habit': return weakestHabitResponse(data);
    case 'best_habit': return bestHabitResponse(data);
    case 'streak': return streakResponse(data);
    case 'tip': return tipResponse(data);
    case 'identity': return identityResponse(data);
    case 'next_goal': return nextGoalResponse(data);
    case 'specific_habit': return cls.habit ? specificHabitResponse(data, cls.habit) : fallbackResponse(data);
    case 'celebrate': return celebrateResponse();
    default: return fallbackResponse(data);
  }
}
