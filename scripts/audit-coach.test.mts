/* eslint-disable */
// Test funcional del motor del Coach (classify + composers) y edge cases.
// Corre con: npx tsx scripts/audit-coach.test.mts
// Objetivo: cazar crashes y clasificaciones incorrectas que NO se ven compilando.

import { getCoachResult } from '../src/lib/coach-rules.ts';
import { dateKey } from '../src/lib/dates.ts';
import type { AppData, Habit, Completions } from '../src/lib/types.ts';

let pass = 0, fail = 0; const fails: string[] = [];
function ok(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; fails.push(name); console.log(`  ✗ ${name}  ${detail}`); }
}

function mkData(habits: Habit[], comp: Completions = {}): AppData {
  return {
    schemaVersion: 2, habits, completions: comp, achievements: [],
    onboardingCompleted: true, theme: 'dark', lastMilestoneShown: {},
    freezesRemaining: 2, freezesResetMonth: '2026-05', freezesUsed: {},
  };
}
function H(id: string, name: string, over: Partial<Habit> = {}): Habit {
  return { id, name, colorIdx: 0, createdAt: '2026-03-01', monthlyGoal: 20, frequency: { type: 'daily' }, ...over };
}

console.log('\n=== CRASH-SAFETY: nombres de hábito con metacaracteres regex ===');
// El usuario PUEDE nombrar un hábito "C++", "Leer (notas)", etc. classify()
// hace new RegExp(nombre) — si no escapa, tira SyntaxError y crashea el Coach.
const dangerous = ['C++', 'Correr (5k)', 'Leer +10 páginas', 'Meditar [am]', 'Foco 100%', 'Plan A|B', 'Gym $$$', 'Code{}', 'a?b', 'x*y',
  // Brackets SIN cerrar en palabra larga (>3 chars) — estos sí rompen new RegExp:
  'Rutina(mañana', 'Leer [pendiente', 'Foco )cierre', 'meditarmas++ya'];
for (const name of dangerous) {
  const data = mkData([H('h1', name), H('h2', 'Meditar')]);
  let threw = false, txt = '';
  try { txt = getCoachResult('¿cómo voy este mes?', data).text; }
  catch (e) { threw = true; txt = String((e as Error).message); }
  ok(`no crashea con hábito "${name}"`, !threw, `THREW: ${txt}`);
}

console.log('\n=== CLASSIFY: preguntas comunes → intent correcto ===');
{
  const data = mkData([H('h1', 'Entrenar'), H('h2', 'Meditar'), H('h3', 'Leer')]);
  const cases: Array<[string, string]> = [
    ['hola', 'greet'],
    ['gracias!', 'thanks'],
    ['¿cómo voy este mes?', 'monthly_review'],
    ['¿cómo me fue esta semana?', 'weekly_review'],
    ['¿cuál es mi mejor hábito?', 'best_habit'],
    ['dame un consejo', 'tip'],
    ['motivame', 'motivate_me'],
    ['¿qué tengo hoy?', 'today_outlook'],
    ['hace cuanto que no entreno', 'time_since'],
    ['¿cuántos días perfectos?', 'perfect_days_count'],
    ['estoy con muchas ganas de meditar', 'specific_habit'], // detecta "meditar"
    // Nuevos (2.3): capabilities + más cobertura natural
    ['¿qué podés hacer?', 'capabilities'],
    ['ayuda', 'capabilities'],
    ['¿en qué me ayudás?', 'capabilities'],
    ['¿cómo vengo este mes?', 'monthly_review'],
    ['¿qué día fallo más?', 'weekday_pattern'],
  ];
  for (const [q, want] of cases) {
    const got = getCoachResult(q, data).intent;
    ok(`"${q}" → ${want}`, got === want, `GOT ${got}`);
  }
}

console.log('\n=== CLASSIFY: mood bajo → demotivated/compasivo ===');
{
  const data = mkData([H('h1', 'Entrenar')]);
  const r = getCoachResult('estoy agotado, no doy mas', data);
  ok('"no doy mas" → demotivated', r.intent === 'demotivated', `GOT ${r.intent}`);
}

console.log('\n=== BATERÍA: getCoachResult nunca devuelve texto vacío ni crashea ===');
{
  const comp: Completions = {};
  // un poco de data real (mayo 2026)
  for (let i = 1; i <= 20; i++) comp[`2026-05-${String(i).padStart(2,'0')}`] = { h1: { done: true }, h2: { done: i % 2 === 0 } };
  const data = mkData([H('h1','Entrenar'), H('h2','Meditar',{timeSlot:'morning'}), H('h3','Leer',{frequency:{type:'weekly',timesPerWeek:3}})], comp);
  const questions = [
    'hola','gracias','como voy','esta semana','mi año','dias perfectos','total','que dia fallo',
    'mañana o noche','correlaciones','finde vs semana','mejor habito','peor habito','racha',
    'que abandone','analizame entrenar','consejo','mantener racha','como vuelvo despues de fallar',
    'bajar friccion','lunes','rutina mañana','rutina noche','meta','proyectame','listo para sumar',
    'que habito sumo','cuando se forma','quien soy','motivame','desmotivado','logre algo',
    'mis notas','ayer','hace cuanto que no leo','compara entrenar vs meditar','que tengo hoy',
    'hago suficiente','dame mi resumen','asdkfj aleatorio xyz',
  ];
  let allOk = true, badQ = '';
  for (const q of questions) {
    try {
      const r = getCoachResult(q, data);
      if (!r.text || r.text.trim().length === 0) { allOk = false; badQ = `vacío: "${q}"`; break; }
      if (!Array.isArray(r.followUps)) { allOk = false; badQ = `followUps no-array: "${q}"`; break; }
    } catch (e) { allOk = false; badQ = `THREW en "${q}": ${(e as Error).message}`; break; }
  }
  ok(`${questions.length} preguntas: ninguna vacía ni crashea`, allOk, badQ);
}

console.log('\n=== EDGE: data vacía / sin hábitos ===');
{
  const empty = mkData([]);
  let threw = false;
  try { const r = getCoachResult('como voy', empty); ok('sin hábitos → fallback no-vacío', !!r.text && r.intent === 'fallback'); }
  catch (e) { threw = true; ok('sin hábitos no crashea', false, (e as Error).message); }
}

console.log(`\n========== COACH: ${pass} PASS, ${fail} FAIL ==========`);
if (fail) console.log('FALLARON:\n - ' + fails.join('\n - '));
