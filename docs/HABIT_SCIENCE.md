# HABIT_SCIENCE.md — Dossier para Husu Habits

> Síntesis de la ciencia del cambio de hábitos para informar el diseño de **Husu Habits**, app Android (español) de tracker de hábitos.
> Última revisión: 2026-05-10. Citas verificadas vía búsqueda web (mayo 2026); donde una afirmación es divulgativa, lo señalo explícitamente.

---

## 1. Modelos canónicos de formación de hábitos

### 1.1 The Habit Loop — Charles Duhigg, *The Power of Habit* (2012)
Modelo neurológico de tres pasos: **cue → routine → reward** [Duhigg, 2012]. El cue puede ser tiempo, lugar, emoción, personas u otra acción previa. Duhigg describe la "Golden Rule" del cambio de hábito: para cambiar un hábito, hay que **mantener el mismo cue y la misma recompensa, sustituyendo solamente la rutina**. También introduce **"keystone habits"** (ejercicio, hacer la cama) que arrastran cambios en otras conductas.

### 1.2 Atomic Habits — James Clear (2018)
Extiende a 4 pasos: **cue → craving → response → reward**, y propone las **Cuatro Leyes del Cambio de Conducta** [Clear, 2018]:
1. **Make it obvious** (cue visible)
2. **Make it attractive** (craving)
3. **Make it easy** (low-friction response)
4. **Make it satisfying** (reward inmediato)

Para romper malos hábitos se invierten: invisible / unattractive / difficult / unsatisfying. Concepto central: **"every action is a vote for the type of person you wish to become"** — ver §3 (identity-based habits).

### 1.3 Tiny Habits / Fogg Behavior Model — BJ Fogg, Stanford Behavior Design Lab
Fórmula: **B = MAP** (Behavior = Motivation × Ability × Prompt) [Fogg, 2009 como B=MAT; rebautizado B=MAP en *Tiny Habits*, 2019]. Los tres elementos deben coincidir simultáneamente; si falta uno, no hay conducta. Receta operativa: **"After I [ANCHOR], I will [TINY BEHAVIOR]. Then I celebrate"**. Stanford Behavior Design Lab fundado por Fogg (`behaviordesign.stanford.edu`).

### 1.4 Transtheoretical Model — Prochaska & DiClemente (1983)
5 etapas: **precontemplation → contemplation → preparation → action → maintenance** [Prochaska & DiClemente, 1983; Prochaska & Velicer, 1997]. "Action" cubre <6 meses de cambio sostenido; "maintenance" >6 meses. Investigación posterior describe el avance como espiral, no lineal — recaídas son normales y no señalan fracaso.

### 1.5 Implementation Intentions — Peter Gollwitzer (1999)
Plan if-then: **"When situation X arises, I will perform behavior Y"** [Gollwitzer, 1999, *American Psychologist*]. Meta-análisis Gollwitzer & Sheeran (2006), 94 estudios / 8.000+ participantes: efecto **medio-grande sobre logro de metas, d ≈ 0.65**; automaticidad: immediacy d=.77, efficiency d=.85, lack of intent d=.72.

### 1.6 Habit Stacking — S.J. Scott; James Clear
Variante popular de Implementation Intentions: anclar un nuevo hábito a uno existente. Fórmula Clear: **"After [CURRENT HABIT], I will [NEW HABIT]"**. Coincide con el "anchor" del Tiny Habits Recipe de Fogg.

### 1.7 Hooked Model — Nir Eyal, *Hooked* (2014)
4 fases para productos habit-forming: **trigger → action → variable reward → investment** [Eyal, 2014]. Tres tipos de variable rewards: tribe (social), hunt (recursos), self (mastery/self-realization). El "investment" (tiempo, datos, contenido aportado) aumenta el valor percibido del producto y dispara el próximo trigger interno. Origen ético controvertido — útil descriptivamente pero exige cuidado al aplicarlo (Eyal mismo escribió *Indistractable* como contrapunto).

### 1.8 Wendy Wood (USC Dornsife) — automaticidad y context-cues
Wood enfatiza que los hábitos son **asociaciones contexto-respuesta** aprendidas vía Hebbian learning [Wood & Rünger, 2016, *Annual Review of Psychology*; Wood, Mazar & Neal, 2021]. Una vez formado, el cue contextual activa la respuesta sin necesidad de motivación consciente. Implicación clave: **cambiar intenciones tiene impacto limitado sobre hábitos arraigados; hay que cambiar el contexto o la fricción**.

---

## 2. Cuánto tarda en formarse un hábito — debunk del mito de los 21 días

El "21-day myth" se atribuye a malinterpretaciones del cirujano plástico Maxwell Maltz (*Psycho-Cybernetics*, 1960), que observó que pacientes tardaban *al menos* ~21 días en adaptarse a cambios físicos. No fue un estudio de formación de hábitos.

**Evidencia real:** Lally, van Jaarsveld, Potts & Wardle (2010), *European Journal of Social Psychology*, 40(6), 998-1009 — "How are habits formed: Modelling habit formation in the real world" [Lally et al., 2010]. 96 voluntarios eligieron una conducta (comer, beber o actividad) en un contexto fijo durante 12 semanas, completando el Self-Report Habit Index (SRHI) diario. **Mediana ≈ 66 días** para alcanzar 95% del asíntota de automaticidad; **rango 18-254 días**.

**Implicaciones de diseño para Husu:**
- No prometer "21 días para un hábito" en copy ni onboarding.
- Diseñar para horizontes de **2-3 meses mínimo** por hábito.
- Mostrar progreso de automaticidad gradual, no binario "formado/no formado".
- Comunicar que la **variación individual es enorme**: un hábito simple (beber agua) se automatiza en semanas; uno complejo (correr 5km) puede tomar 6+ meses.
- Lally también encontró que **saltarse un día único no impacta significativamente** el progreso de automaticidad — saltarse varios consecutivos sí.

---

## 3. Patrones psicológicos que refuerzan adherencia

| Patrón | Origen / cita | Mecanismo |
|---|---|---|
| **Variable rewards** | Skinner, *Schedules of Reinforcement* (1957) | Variable-ratio = la programación más resistente a extinción; produce respuesta alta y persistente. Slot machines, redes sociales. |
| **Streak / chain** | Folk-popularizado por Jerry Seinfeld ("Don't Break the Chain") — atribución originalmente reportada por Brad Isaac (Lifehacker, 2007); **no hay paper académico citando a Seinfeld**. El principio sí está en literatura de goal-streaks. | Visualización contínua aumenta adherencia. |
| **Loss aversion en streaks** | Kahneman & Tversky (1979), *Prospect Theory*, *Econometrica* | Pérdidas pesan ~2x más que ganancias equivalentes. Aplicado a streaks: el riesgo de "perder" 47 días de racha motiva más que ganar el día 48. |
| **Public commitment / accountability** | Cialdini, *Influence* (1984); literatura de commitment devices | Compromiso público activa consistencia social y reputacional. |
| **Identity-based habits** | Clear, *Atomic Habits* (2018) | "Cada acción es un voto por el tipo de persona que querés ser." Cambio sostenido = cambio de identidad, no de outcome. |
| **Two-Minute Rule** | Clear, *Atomic Habits* (2018) | Reducir cualquier hábito a una versión que se hace en ≤2 minutos para superar la fricción de inicio. |
| **Environment design / friction** | Wood (USC); Thaler & Sunstein, *Nudge* (2008) | Reducir fricción a hábitos buenos, aumentarla a malos (ej. esconder el celular en otra habitación). |
| **Temptation bundling** | Milkman, Minson & Volpp (2014), *Management Science*, "Holding the Hunger Games Hostage at the Gym" | Atar conducta deseable (gym) con un "guilty pleasure" (audiolibros disponibles solo allí). Resultado: +51% asistencia al gym vs control. Replicado a gran escala (Milkman et al., 2020): +10-14% likelihood de workout semanal entre 6.792 participantes. |

---

## 4. Cuántos hábitos rastrear simultáneamente

**No hay un número canónico avalado por RCT.** Lo que la literatura sí soporta:
- **Recursos de executive function son limitados** (Baumeister; literatura de ego depletion — atención: replica con metaanálisis recientes mixtos).
- **Cognitive load alto compite con la capacidad de regulación de cada hábito individual** [Wood & Neal, 2007; Wood, 2024].
- Recomendaciones convergentes en literatura aplicada y blogs autoritativos: **3-5 hábitos simultáneos** al inicio. Más allá de ~7 lleva a "habit overload" y abandono.

**Investigación user-research (no peer-reviewed, atribuida a Stanford Persuasive Tech Lab por blogs de gamificación):** "el mayor predictor de abandono de tracker no son features faltantes sino setup friction; empezar con ≤3 hábitos". *Aviso: no encontré el paper original — tratar como heurística de la industria.*

**Recomendación para Husu:**
- Onboarding limita a **3 hábitos iniciales máximo** (con opción de agregar más después).
- "Add habit" disponible pero después de 14 días de uso, o cuando el usuario alcance 80% de adherencia 2 semanas seguidas (regla popularizada para habit-graduation).
- Cap suave a 7-8 hábitos activos; más allá, sugerir archivar alguno.

---

## 5. Patrones de fallo y recovery

**Datos de retención** (industria, no académicos rigurosos):
- 77% de usuarios abandonan cualquier app dentro de los 3 días post-install (industry benchmark estándar).
- D1 retention promedio ≈ 26% across categorías.
- Apps gamificadas: alto engagement primeras 2 semanas, pero **67% abandono por semana 4** según reportes de gamificación citando Stanford Persuasive Tech (no verifiqué el paper original — citar con cautela).

**Intervenciones que funcionan:**
- **Streak Freeze (Duolingo)**: equipar uno protege un día perdido; permitir hasta 2 freezes simultáneos aumentó **+0.38% el número de active learners diarios** según el blog de ingeniería de Duolingo. Usuarios que llegan a streak de 7 días son **3.6x más likely** a completar el curso [Duolingo Blog, ingeniería].
- **Recovery streaks**: Duolingo da 3 días post-pérdida para completar lecciones especiales y restaurar la racha.
- Base académica de "slack/flexibility": investigación de UPenn / UCLA (citada en blog Duolingo) sugiere que **dar flexibilidad explícita motiva más que reglas rígidas**.
- **Missed-day grace** evita el efecto "what-the-hell" (Polivy & Herman): tras un slip, abandono total porque "ya rompí la racha".

---

## 6. Behavior Change Techniques — Behaviour Change Wheel

**Susan Michie et al. (2013)**, *Annals of Behavioral Medicine*, 46(1), 81-95 — **BCTTv1: 93 técnicas de cambio de conducta**, agrupadas en **16 clusters jerárquicos** [Michie et al., 2013]. Desarrollada vía consenso Delphi con 14+18 expertos; entrenamiento ha alcanzado >1.400 personas en 33 países.

**BCTs especialmente aplicables a una habit-tracker app:**

| Cluster BCTTv1 | BCTs específicos | Aplicación a Husu |
|---|---|---|
| 1. Goals and planning | Goal setting (1.1), Action planning (1.4), Review behavior goal(s) (1.5) | Setup de meta + frecuencia + plan if-then |
| 2. Feedback and monitoring | Self-monitoring of behavior (2.3), Feedback on behavior (2.2) | Marca diaria + dashboard de progreso |
| 3. Social support | Social support (unspecified) (3.1), Social support (practical) (3.2) | Compartir progreso, accountability partners |
| 5. Natural consequences | Information about health consequences (5.1) | Mensajes contextuales sobre beneficios |
| 6. Comparison of behavior | Social comparison (6.2) | Leaderboards opt-in (cuidado — ver §3 nota gamificación) |
| 7. Associations | Prompts/cues (7.1) | Notificaciones contextuales |
| 8. Repetition and substitution | Habit formation (8.3), Behavioral practice/rehearsal (8.1) | Repetición programada |
| 10. Reward and threat | Non-specific reward (10.3), Self-reward (10.9) | Celebraciones, badges, streaks |
| 13. Identity | Identification of self as role model (13.1) | Identity-based prompts |
| 15. Self-belief | Verbal persuasion about capability (15.1), Self-talk (15.4) | Affirmations, growth-mindset copy |

---

## 7. Aplicación a Husu Habits — recomendaciones concretas

### Onboarding e identidad
1. **Identity-first onboarding [Clear]**: primera pregunta = *"¿Quién querés ser?"* (ej. "una persona que se mueve cada día") **antes de** *"¿qué hábito querés sumar?"*. Texto del hábito puede leer "Yo soy alguien que [acción]" en vez de "Hacer [acción]".
2. **Cap inicial de 3 hábitos** [literatura de cognitive load]. Botón "agregar otro" deshabilitado/oculto los primeros 14 días o hasta llegar a 80% adherencia 2 semanas seguidas.
3. **Plantilla if-then explícita en setup** [Gollwitzer, d=0.65]: el usuario debe escribir cuándo, dónde y cómo. Form fields: *"Después de ____, voy a ____ en ____"*. Sin esto, el hábito no se guarda.

### Cue, friction y context
4. **Notificación contextual con hora + lugar configurables** [Make it obvious — Clear; Wood context-cues]: no "Recordá tu hábito" sino *"7:30 — después del café, 5 minutos de respiración"*. Soporte para geofencing opcional.
5. **Two-Minute Rule built-in**: cada hábito tiene un campo opcional "versión 2 minutos" para días de baja energía. Marcar la versión mini cuenta para la racha (mantiene identidad sin romper consistencia).
6. **Habit stacking sugerido**: al crear el hábito #2+, mostrar lista de hábitos existentes y proponer "anclar" después de uno.

### Variable reward + satisfaction
7. **Variable reward visual** [Skinner; Hooked]: la animación de celebración al marcar tiene 4-5 variantes que rotan al azar — más resistente a extinción que recompensa fija. Sonido opcional pero on por default.
8. **Celebration immediata** [Fogg Tiny Habits]: micro-animación + frase corta variada en ES rioplatense ("¡Ahí va!", "Bien firme", "Otro voto por vos"). El "celebration" no es opcional — es la cuarta ley de Clear (Make it satisfying).

### Streaks, loss aversion y recovery
9. **Streak visible y protagonista** en home, con loss aversion visual — "Día 47 — no rompas ahora" [Kahneman & Tversky; Duolingo data]. Pero con cuidado: la racha es un proxy de identidad, no la métrica primaria.
10. **Comodín mensual (Streak Freeze)**: 1 freeze por mes free, no acumulable más allá de 2 (modelo Duolingo). Reseteo el día 1 de cada mes. Texto: *"Usá tu comodín — no contás como roto, pero la racha no avanza"*.
11. **Recovery 48h grace**: si se rompe la racha, 48h para hacer "doble sesión" del hábito y recuperar el streak (evita el "what-the-hell effect"). Configurable per-user.
12. **Missed-day messaging anti-shame** [TTM relapse normalization]: después de un slip, tono no-punitivo. *"Pasa. Hoy es día 1 de la próxima racha"*. Nunca usar emoji-tristes ni "fallaste".

### Tracking ligero y graduation
13. **Self-monitoring minimalista** [BCT 2.3]: 1-tap toggle, no requiere abrir el hábito. Widget Android home-screen como tap-target principal.
14. **Habit graduation visible**: tras ~66 días con >80% adherencia [Lally 2010], badge + mensaje *"Esto ya es parte tuya"* y opción de moverlo a "automático" (oculto del feed principal, libera slot).
15. **Identity weekly review**: una vez por semana, prompt corto: *"Mostrame qué votos cumpliste esta semana para ser [identity elegida en onboarding]"*. Refuerza la conexión hábito↔identidad sin reportería pesada.

### Cosas a evitar (anti-patterns)
- **No** prometer "21 días para un hábito".
- **No** usar leaderboards públicos por default — investigación citada sugiere que para ~41% de usuarios la gamificación competitiva *daña* la formación de hábito (no-gamificados fueron 3.7x más likely a mantener el hábito tras dejar de trackear, según research industry — verificar antes de citar formalmente).
- **No** notificaciones genéricas sin contexto de hora/lugar.
- **No** castigar visualmente el slip (rojos agresivos, badges de "perdedor").

---

## Bibliografía clave (verificable)

- Clear, J. (2018). *Atomic Habits*. Avery. [`jamesclear.com/atomic-habits-summary`]
- Duhigg, C. (2012). *The Power of Habit*. Random House.
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*. Portfolio.
- Fogg, B.J. (2019). *Tiny Habits*. Houghton Mifflin Harcourt. [`behaviormodel.org`, `behaviordesign.stanford.edu`]
- Gollwitzer, P.M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist*, 54(7), 493-503.
- Gollwitzer, P.M. & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119.
- Kahneman, D. & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. *Econometrica*, 47(2), 263-292.
- Lally, P., van Jaarsveld, C.H.M., Potts, H.W.W. & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology*, 40(6), 998-1009. [`onlinelibrary.wiley.com/doi/10.1002/ejsp.674`]
- Michie, S., Richardson, M., Johnston, M., Abraham, C., Francis, J., Hardeman, W., Eccles, M.P., Cane, J. & Wood, C.E. (2013). The behavior change technique taxonomy (v1) of 93 hierarchically clustered techniques. *Annals of Behavioral Medicine*, 46(1), 81-95.
- Milkman, K.L., Minson, J.A. & Volpp, K.G.M. (2014). Holding the Hunger Games Hostage at the Gym: An Evaluation of Temptation Bundling. *Management Science*, 60(2), 283-299.
- Prochaska, J.O. & DiClemente, C.C. (1983). Stages and processes of self-change of smoking. *Journal of Consulting and Clinical Psychology*, 51(3), 390-395.
- Skinner, B.F. (1957). *Schedules of Reinforcement*. Appleton-Century-Crofts.
- Wood, W. & Rünger, D. (2016). Psychology of Habit. *Annual Review of Psychology*, 67, 289-314.
- Wood, W., Mazar, A. & Neal, D.T. (2021). Habits and Goals in Human Behavior: Separate but Interacting Systems. *Perspectives on Psychological Science*.

**Fuentes secundarias consultadas (industry / blogs autoritativos):** Duolingo Engineering Blog (streak design); UCL News; University of Surrey (Lally interview); Character Lab (Milkman); BCT Taxonomy oficial (`bct-taxonomy.com`); Stanford Behavior Design Lab.

**Afirmaciones a tratar con cautela hasta verificar paper original:** estadísticas de "67% abandono apps gamificadas semana 4" y "41% de usuarios la gamificación daña" — circulan en blogs de gamificación atribuidas a Stanford Persuasive Tech Lab; no encontré el paper primario en esta investigación.
