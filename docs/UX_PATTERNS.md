# Husu Habits — UX Patterns & Behavior Design

Investigacion sintetica de patrones probados en habit tracking + apps adyacentes (fitness, mindfulness, language learning, wearables) para informar el roadmap de Husu.

---

## 1. Onboarding patterns que activan

| Pattern | App ref | Pantalla | Por que funciona | Husu |
|---|---|---|---|---|
| **No-account first lesson** | Duolingo | Selector de idioma > 3 preguntas > leccion inmediata, login al final | Cero friccion, conversion sube; el "first win" llega antes de pedir email | Permitir crear primer habito + check sin cuenta. Pedir cuenta solo cuando exporten o quieran sync |
| **Identity question first** | Atoms (oficial Atomic Habits), Cohorty | "Quien queres ser?" antes de "que queres hacer". Inputs tipo "Soy alguien que cuida su cuerpo" | Identity-based language: usuarios con frasing identitario son 2.7x mas propensos a sostener el habito a 6 meses | Onboarding step 1: cards con identidades ("Persona activa", "Lector constante", "Calmado", "Padre/madre presente"). Cada habito sugerido se etiqueta con la identidad que vota |
| **Persona-based templates** | Strides, Fabulous | El usuario elige "Estudiante", "Atleta", "En recuperacion" y se carga preset de habitos | Reduce decisiones de 50 a 5; primer habito ya esta en la pantalla en <60s | Husu ya tiene templates: agregar persona-bundle (3-5 habitos juntos por arquetipo), no solo habitos sueltos |
| **Commitment device en onboarding** | Duolingo | Pregunta "cuantos minutos por dia?" al final del flow | Setear meta = compromiso publico contigo mismo; mejora retorno dia 2-7 | Despues de elegir habito, preguntar "que tan importante es esto para vos del 1 al 10?" — guardar y usar en re-engagement |
| **Progressive disclosure** | Duolingo, Notion | Leagues, freeze, quests aparecen recien al dia 5-7 | Evita feature overload; cada feature llega cuando hay contexto para entenderla | No mostrar AI Coach, achievements, ni heatmap el primer dia. Desbloquear al dia 3, 7, 14 con pequeno reveal |
| **Anti-pattern detectado** | Calm, Headspace | 8-10 pantallas con preguntas/personalizacion antes de meditar | Conversion a primera sesion cae 30-40%. Solo aceptable si llevas brand trust enorme | Husu: maximo 4 pantallas antes del primer check |

**Principio rector:** First check-in en <60s desde install. Identity > goal. Pedir cuenta lo mas tarde posible.

---

## 2. Activacion diaria / retencion

- **Smart timing por habito** (Productive, Habitify): inferir morning/evening segun categoria. "Meditar" sugiere AM/PM-noche; "ejercicio" AM; "leer" noche. Husu hoy permite hora manual — agregar sugerencia automatica al crear.
- **Reminder especifico de contexto > vago**: "Meditar cuando llegues a casa" 2x mas efectivo que "meditar hoy". Pedir lugar/trigger opcional al setear habito (Atomic Habits implementation intentions).
- **Stagger de notifs**: nunca disparar 7 habitos a las 8:00. Espaciar 3-5 min, o agrupar en una sola "Tenes 4 habitos de la manana" expandible.
- **Empty notification policy**: si el usuario ya marco todo, NO mandar reminder. Apps que insisten igual generan churn (citado en Habitify changelog).
- **Re-onboarding al regresar**: si vuelven despues de 7+ dias dormidos, no mostrar streak rota — mostrar "Bienvenido de vuelta" + 1 habito sugerido para hoy. Reset opcional, no automatico.
- **Widgets**: Apple Reminders demostro que el widget en home es la unica forma de check < 1 segundo. Para Android: widget 2x2 con los 3 habitos del dia + tap = check. Critico para retencion de power users.
- **WhatsApp/canal alterno**: 98% open rate vs 20% push (Fhynix). Considerar opcion de reminder por mail para usuarios que silencian notifs.

---

## 3. Visualizacion de progreso

| Pattern | Cuando funciona | Cuando abruma | Aplicacion Husu |
|---|---|---|---|
| **Heatmap GitHub-style** | Vista anual zoom-out, una sola metrica (total checks/dia). Bueno para year-in-review | Si lo mostras como home y tenes 12 habitos, los cuadritos se vuelven ilegibles | Husu ya lo tiene: mantenerlo en "stats" tab, no en home. Permitir filtrar por habito unico o "todos" |
| **Streaks visibles** | Numero grande + flame icon, contextualizado ("tu mejor: 47") | Si es la unica metrica, genera ansiedad. Snapchat hourglass = anti-pattern documentado | Mostrar streak actual + best streak juntos. Nunca poner countdown a "vas a perder la streak" |
| **Progress rings** | Apple Activity ring: 3 metricas, completion intuitiva | Solo 3 anillos max — mas se vuelve ruido | Para Husu: ring por categoria (Mente/Cuerpo/Trabajo) en home, no por habito individual |
| **Calendar view** | TickTick: scroll vertical de meses, dots por dia con check | Ocupa pantalla completa, dificil zoom | Vista alternativa al heatmap, mensual, swipeable |
| **Year in pixels** | Mood + 1 dimension simple. Bonito para journaling | No para tracking de muchos habitos | Husu: vista "Mi 2026" con 365 cuadrados coloreados por mood + % completion |
| **Weekly summary card** | Notion, Whoop "this week": 4-5 numeros grandes + insight | Si pones 20 metricas se vuelve dashboard SaaS | Card compartible los domingos: "Esta semana: 5/7 dias, racha +3, mejor habito X" |

---

## 4. Gamification SIN infantilizar adultos

- **Habitica funciona** para usuarios <25, gamers, ADHD que necesitan estructura ludica explicita. **Falla** para profesionales 30+ que ven el pixel art como fricción estética.
- **Alternativas maduras:**
  - **Streaks (iOS)**: cero gamification visible. La recompensa es el numero subiendo y el ring lleno. Tipografia editorial, paleta sobria.
  - **Strava**: kudos + leaderboards. La gamification esta en el rendimiento real, no en tokens ficticios.
  - **Todoist Karma**: puntos invisibles para el casual, accesibles para el power user. No te bombardea.
  - **Atoms**: animacion satisfactoria al completar pero sin XP/levels.
- **Achievements que valen vs vacios:**
  - Vale: "Primera semana completa" (relacionado al esfuerzo real, raro), "100 checks", "Volviste despues de 14 dias" (recovery achievement)
  - Vacio: "Abriste la app 5 veces", "Compartiste algo" (recompensa la mecanica, no el habito)
- **Streak freeze / insurance**: Duolingo Streak Freeze redujo churn 21% en usuarios at-risk. Patron: 1-2 freezes gratis por mes, auto-aplicado, anuncio post-facto ("usamos tu freeze ayer"). NUNCA cobrarlo o ponerlo paywall — eso convierte la feature en manipulacion.
- **Variable rewards eticos** (Indistractable, Eyal contraria a Hooked): la sorpresa debe ser informativa ("nuevo insight desbloqueado") no aleatoria estilo slot machine. Husu AI Coach puede entregar insights variables semanales — eso es etico.

---

## 5. Social y accountability

- **StickK** (Yale behavioral econ): commitment contracts con stakes financieros + arbitro humano. Conversion a goal: 65% sin partner, 95% con accountability appointment. Patron extremo, no para todos.
- **Strava model**: kudos publicos sobre actividad real. Funciona porque la gente ya quiere mostrar el esfuerzo. Riesgo: vanity metrics, performance social.
- **Anonymous community** (r/getdisciplined, r/HabitRPG): identidad protegida + apoyo de pares. Mas etico que feed publico.
- **Trade-off para Husu**: agregar social feature solo opt-in extremo. Por defecto: privado. Considerar "accountability buddy" 1-a-1 (no feed publico) — mensaje semanal automatico al partner con % de la semana, sin detalles de habitos especificos.

---

## 6. Reduccion de friccion

| Tecnica | Ejemplo | Husu |
|---|---|---|
| One-tap check desde notif | iOS Reminders quick action | Action button "Marcar hecho" en la notif Android — sin abrir app |
| Widget home | iOS Reminders widget, Streaks | Widget 2x2 + 4x2 con check directo |
| Voice input | Apple Reminders Siri shortcut | "Hey Google, marca leer en Husu" |
| Quick-add desde lock screen | iOS 26 Control Center | Tile en quick settings Android para "abrir Husu en check rapido" |
| Wearable | Apple Watch Streaks complication | Wear OS tile para usuarios con smartwatch |
| Backfill | "Olvide ayer" en 2 taps | Long-press en el dia anterior del calendar > marcar |

**Regla:** si el check toma >5 segundos desde tener el telefono en la mano, perdiste un % de retencion ese dia.

---

## 7. Recovery y compassion

- **Skip days vs miss days**: distincion critica. "Skip" = decision deliberada (estoy de viaje), no rompe streak. "Miss" = olvido. Habitify, Streaks ya distinguen. Husu: agregar skip explicito con razon opcional ("descanso", "viaje", "enfermedad").
- **What the Hell Effect**: si rompiste un dia, alta probabilidad de abandonar. Mitigacion: streak repair (Pacer, Brainscape). 1 reparacion gratis por mes, dentro de los 7 dias.
- **Tono de copy en falla**:
  - Streaks: silencio. Solo el numero vuelve a 0.
  - Finch: "Esta bien. Manana es otro dia. Tu pajarito te quiere igual." (compassionate)
  - Habitica: HP perdido, dramatico. Funciona para algunos, hostil para otros.
  - Husu: tomar de Finch — copy gentil, never punitivo. "No pasa nada. Que tal arrancar de nuevo hoy?"
- **Off days estructurales**: permitir definir "este habito es 5/7 dias" (Husu ya tiene frequency types — extender con "max permitido sin romper streak").
- **Anti-ansiedad**: nunca usar countdown timer "te quedan 4 horas para no perder la racha". Es el patron Snapchat documentado como toxico.

---

## 8. Insights y AI

- **Spotify Wrapped weekly**: rolling 28 dias, 1 highlight unico, shareable. Replicar: Husu Sunday Recap card con 1 insight memorable ("Esta semana fuiste mas constante de noche") + boton compartir como imagen.
- **Whoop Coach + Oura Advisor**: AI conversacional sobre metricas propias del usuario. Patron: pattern detection ("tu adherencia sube 30% cuando dormis 7+ hs"). Husu AI Coach (Gemini) puede correlacionar:
  - Habito X vs dia de la semana
  - Habito X vs hora de check
  - Habitos que se hacen juntos vs separados
  - Mood (si se trackea) vs adherencia
- **Tono del coaching**:
  - Whoop: cientifico, datos primero ("tu HRV bajo 12% esta semana")
  - Oura: encouraging, conversacional ("notamos que descansas mejor cuando...")
  - Husu: hibrido — dato concreto + tono calido. NUNCA tono motivacional vacio ("tu puedes!"). Siempre anclar en evidencia del usuario.
- **Output cadence**: insight diario = ruido. Insight semanal (domingo PM) + monthly deep dive = sweet spot.

---

## 9. Microinteracciones memorables

| Microinteraccion | App | Descripcion | Husu |
|---|---|---|---|
| Confetti al cerrar lesson | Duolingo | Burst colorido + sonido suave al completar todos los ejercicios | Confetti SOLO en milestones (semana completa, 30 dias) — no en cada check |
| Breathing dot al meditar | Headspace | Circulo que respira durante el wind-down | Pre-check "respira" opcional en habitos de mindfulness |
| Streak warning suave | Duolingo | "Tu streak esta en peligro" 6h antes — un solo aviso | Husu: 1 reminder a 2h del fin del dia, opt-out facil |
| Empty state con personalidad | Linear, Notion | Linear: "Nothing to see here. Yet." con ilustracion linea | Empty states de Husu: copy con voz humana, no "No hay datos" |
| Pull-to-refresh creativo | Twitter, Things | Animacion custom al refrescar | Husu: pull para "ver mi semana" con animacion del heatmap llenandose |
| Haptic on check | iOS Reminders, Streaks | Tic haptico al marcar | Critico: vibracion corta y placentera al check. Sin esto el tap se siente inerte |
| Number animation | Apple Activity | Numeros que cuentan hacia arriba en vez de aparecer fijos | Streak counter animado al subir |

---

## 10. Etica y bienestar digital

- **Tristan Harris / Center for Humane Technology**: el sesgo del rubro tracker es maximizar tiempo en app. Husu deberia maximizar adherencia al habito real — que el usuario abra la app menos con el tiempo es exito.
- **Anti-patterns a evitar:**
  - Notificaciones que culpan ("Te olvidaste de nuevo")
  - Streaks como unica metrica visible
  - Paywall en streak repair / freeze (extorsion emocional)
  - Feed social que premia performance vs progreso
  - Variable rewards estilo casino sin valor informativo
  - Dark patterns en cancelacion de suscripcion
- **Posicionamiento Husu sugerido**: "tu compañero, no tu jefe". Calmo, privado por default, AI que entiende patrones sin sermonear, sin redes sociales internas, sin presion publica. Diferenciacion clara contra Habitica (gamer-y) y Streaks (austero solo iOS).
- **Time well spent metric interno**: Husu deberia trackear su propio uso. Si un usuario marca habitos en <30 segundos por sesion = exito. Si pasa 10 min scrolleando stats = mal sintoma.

---

## TOP 15 IDEAS PARA IMPLEMENTAR EN HUSU

Ordenadas por impacto/esfuerzo (1 = quick win, 15 = proyecto grande con alto payoff).

1. **One-tap check desde notificacion** — Action button "Marcar hecho" en la notif Android. Reduce friccion al minimo.
2. **Haptic feedback en check** — Vibracion corta + animacion del numero subiendo. Sin esto el tap se siente vacio. 1-2h de trabajo.
3. **Empty notification policy** — Si el usuario ya completo todos los habitos del dia, suprimir reminders pendientes. Anti-churn directo.
4. **Identity-based onboarding step** — Antes de elegir habitos, 1 pantalla con cards de identidad ("Persona activa", "Lector"). Cada habito sugerido se asocia. Aumenta sostenibilidad 2.7x segun research.
5. **Skip day explicito (no rompe streak)** — Long-press en dia + "marcar como descanso/viaje". Distinguir miss de skip. Combate "what the hell effect".
6. **Streak freeze automatico** — 2 freezes gratis por mes, se aplican solos al dia perdido, notificacion suave post-facto. NO paywall.
7. **Sunday Recap card** — Tarjeta dominical compartible con 4 numeros + 1 insight Gemini ("Esta semana fuiste mas constante de noche"). Replica patron Spotify weekly.
8. **Widget 2x2 y 4x2** — Top 3-6 habitos del dia con check directo. Power-user feature critica para retencion.
9. **Tono de copy en falla = compassivo** — Auditar todos los strings. Cero copy punitivo. "Esta bien, manana arrancamos de nuevo" estilo Finch.
10. **Stagger de notifs + agrupacion AM** — En vez de 5 notifs a las 8:00, una sola "Tenes 5 habitos esta manana" expandible.
11. **Smart time suggestion al crear habito** — Inferir AM/PM por categoria + permitir vincular a "trigger" textual ("cuando llegues a casa") para implementation intentions.
12. **Persona-bundles en templates** — Ademas de habitos sueltos, ofrecer paquetes de 3-5 habitos por arquetipo ("Pack: madrugador", "Pack: post-laboral calmo").
13. **AI Coach pattern detection** — Gemini correlaciona habitos x dia/hora/co-ocurrencia y entrega 1 insight semanal. Tono dato + calido, nunca motivacional vacio. Ej: "Cumplis meditar 80% mas cuando ya hiciste ejercicio".
14. **Progress rings por categoria en home** — 3 anillos (Mente/Cuerpo/Trabajo) en home en vez de scroll de 12 habitos. Heatmap se queda en stats tab.
15. **Accountability buddy 1-a-1 opt-in** — Designar 1 contacto que recibe resumen semanal automatico (% del periodo, sin detalle de habitos). Privado, opt-in extremo, sin feed publico.

---

**Principio guia para todas las decisiones:** maximizar adherencia al habito real, no tiempo en app. Husu gana cuando el usuario abre la app 30 segundos por dia y sostiene sus habitos 6+ meses.
