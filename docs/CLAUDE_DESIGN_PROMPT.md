# Prompt para Claude Design — Husu Habits

> Pegá este prompt completo en Claude Design. Si tenés screenshots, adjuntá. Este prompt asume que las decisiones de marca, paleta, tipografía y mascota **ya están tomadas** (research previo).

---

Necesito el sistema visual completo de **Husu Habits**, una app Android de tracker de hábitos en español para adultos 20-45, posicionada como "compañero, no jefe" — calmo, privado, ético, sin gamification agresiva.

La identidad de marca, paleta, mascota y voz **ya están definidas** (ver más abajo). Tu trabajo es traducir esas decisiones a un sistema visual coherente y mockups específicos.

## Identidad LOCKED

### Mascota: Husu, panda rojo 🐼

- Personalidad: adulto, curioso, observador, persistente sin presión. Compañero cálido. NO infantil. NO guru. NO regañón.
- Origen narrativo: panda rojo del Himalaya (juega con la fonética "Husu").
- Diferenciación: ningún competidor de habit tracking usa panda rojo (Duo es búho, Finch pajarito, Habitica avatares RPG).

### Paleta oficial (WCAG AA)

```
husu-clay   #C97B5A  → brand accent, CTA primario
husu-cream  #F5EFE6  → background light theme
husu-ink    #2A2823  → texto principal, dark BG
sage        #7A9B7E  → success/calm
sand        #E8DCC4  → neutral support
dusk        #4A5568  → text-dim
ember       #E5A04C  → streak/heat
mist        #B8C5C1  → info
```

Reemplaza el gradiente naranja-rojo actual de la app con un sistema basado en clay+ember.

### Tipografía

- **Fraunces** (Google Fonts, serif cálido editorial): wordmark "Husu Habits", H1, H2, número de streak grande.
- **Nunito** (Google Fonts, sans rounded): UI body, labels, sub-text.

### Voz y tono (rioplatense, voseo)

- Cálido, breve (≤15 palabras la mayoría), confiable. NUNCA culpa. NUNCA infantiliza.
- Ejemplo OK: "Buen día, ¿arrancamos con el primero?"
- Ejemplo MAL: "¡¡¡Vamos campeón!!! 🔥🔥🔥 No te rindas!!!"
- Ejemplo MAL: "Fallaste tu racha. Tenés que esforzarte más."

## Pantallas a diseñar

### 1. Onboarding (3 pantallas + welcome)

**1.0 Welcome** — Husu saludando + título grande + CTA "Empezar" + skip link.

**1.1 Identity step (NUEVO)** — "¿Quién querés ser?" + 6-8 chips identitarios:
- Alguien que se cuida · Alguien constante · Alguien presente · Alguien curioso · Alguien fuerte · Alguien en paz · + custom

Husu acompaña con expresión "pensativo".

**1.2 Templates picker** — 104 hábitos en 12 categorías, filtros por categoría, badges:
- ⭐ Recomendado (top 20 con mejor evidencia)
- 🪨 Keystone (Duhigg: hábitos que disparan otros)
- Difficulty visual sutil (●○○ easy, ●●○ medium, ●●● hard)

Limita visualmente a "elegí hasta 5 para empezar" con warning si selecciona más.

**1.3 First reminder** — sugerir 1 horario default basado en el primer hábito elegido + permission notification request.

### 2. Header global

- Wordmark "Husu Habits" en Fraunces con tratamiento sutil (sin gradiente arcoíris actual).
- Mascota Husu mini (24px) al lado del wordmark con expresión que cambia según hora del día (mañana energético / tarde concentrado / noche tranquilo).
- Counter "X/Y hoy" a la derecha en Fraunces grande.

### 3. Tab bar (4 tabs)

Registro · Stats · Coach · Hábitos. Activo en clay. Inactivos en dusk.

### 4. Tab Registro (la más usada)

Estados a diseñar:
- **Default** con 4-7 hábitos.
- **Habit con streak alto (>30 días)** — variant especial del row, llamita ember persistente, posible aura.
- **Habit con freeze activo** — 🛡️ en vez de 🔥, copy "escudo activo".
- **Habit que no toca hoy** — fila con opacidad reducida + tag "no toca hoy" sutil.
- **Habit con nota** — indicador 📝 en clay.
- **Día perfect (todos cumplidos)** — algún tratamiento celebratorio sin ser invasivo (mascota Husu chiquito en footer feliz?).
- **Empty state** — Husu grande con CTA.

Day strip horizontal: actualmente tiene mini progress bar dentro de cada chip. Mejorar: ¿progress ring? ¿día activo como una "card flotante"?

### 5. Tab Stats

**Vista Mes:** patrones por día de semana + calendario por hábito.

**Vista Año:** heatmap GitHub-style mejorado (mejor alineación de meses, leyenda más clara, intensidad con paleta clay→ember en vez de un solo color).

**Streak cards** rediseñadas: actual vs best.

**AchievementsPanel:** rediseñar como "colección" en vez de grid plano. Cada badge con progress bar al próximo hito si aplica. Animation al desbloquear con Husu apareciendo a celebrar.

### 6. Tab Coach (HusuAI)

- Avatar circular animado de Husu (loading state cuando piensa, idle pose cuando espera).
- Burbujas chat distintivas — bot en sand+ink, user en clay+cream.
- Banner "necesita API key" rediseñado como onboarding card en vez de warning naranja.
- Sunday Recap card especial (cuando exista, futuro).

### 7. Tab Hábitos

- Lista de hábitos con cuadradito color + emoji + nombre + sub.
- Card "Datos y apariencia" con export/import + theme toggle.
- Sección nueva "Recordatorios" si hay alguno activo, mostrando todos.

### 8. Modal Hábito (Nuevo / Editar)

Layout actual es denso. Mejora:
- Live preview en top: "así se va a ver" con la card del hábito actualizándose en tiempo real.
- Frequency selector como cards visuales en vez de tabs (Daily / X per week / Specific days).
- Implementation intentions (futuro): campo "Voy a hacer esto cuando: [_____]" — diseñá cómo se ve.
- Color picker más bonito (los 10 colores actuales se sienten amateur).

### 9. Toasts y celebraciones

Tres tipos a diseñar (cada uno con Husu en pose distinta):
- **Streak milestone** (3, 7, 14, 30, 66, 100) — Husu con llamita.
- **Achievement unlock** — Husu con corona / medalla.
- **Perfect day** — Husu super feliz + confetti CSS.

Animación de entrada: slide-down con bounce sutil. Auto-dismiss 3.5s.

### 10. Light theme

Toggle desde Hábitos. Variables CSS swap. Asegurar:
- Husu se lee bien en cream (puede necesitar variante con outline).
- Streaks/achievements colors se mantienen vibrantes.
- WCAG AA en ambos temas.

## Lo que necesito como output

1. **Style guide visual** (1 página/board) con tokens: paleta, type scale (display/h1/h2/body/caption con tamaños y line-height), spacing scale, radius scale, shadow scale.

2. **Mascota Husu** en al menos 6 expresiones:
   - Saludando (welcome)
   - Pensativo (identity step, AI Coach loading)
   - Animando (al marcar hábito)
   - Celebrando (perfect day, milestones)
   - Acompañando (después de skip / streak roto)
   - Con corona (achievement supremo)

   Estilo: ilustración limpia, vector-friendly, paleta natural (clay/cream/ember). Inspiración: Finch (selfcare app) por warmth, evitar el cute infantil.

3. **App icon** 512×512 + Android adaptive icon (foreground floating + background tile). Husu icónico, legible a 48dp.

4. **Wordmark "Husu Habits"** horizontal + vertical + icon-only. Fraunces personalizada si querés (ligaduras, modificaciones).

5. **Mockups mobile (360×800)** de cada estado en dark + light:
   - Onboarding 1.0, 1.1, 1.2, 1.3
   - Registro default + con streak alto + perfect day
   - Stats vista Mes + vista Año
   - Coach con/sin conversación
   - Hábitos
   - Modal hábito (nuevo)
   - 3 toasts

6. **Especificación de animaciones** (pseudo-CSS o framer-motion specs):
   - Check de hábito (current: pop, mejorar)
   - Cambio de tab (transition horizontal con easing)
   - Streak milestone toast aparición
   - Confetti perfect day
   - Achievement unlock con Husu animado
   - Reduced motion variants

7. **Guía de uso de Husu** (mascota): cuándo aparece, cuándo NO aparece (no saturar), cómo se anima.

## Constraints técnicos

- Mobile-only por ahora.
- CSS puro + Framer Motion opcional. Sin librerías UI pesadas.
- Lottie OK para animaciones complejas si pesan <30KB cada una.
- Bundle actual: 244KB JS / 16KB CSS. Apuntar a no más de +50KB con assets.

## Referencias visuales concretas

Inspiración a estudiar (apps + features específicos):

| App | Qué imitar | Qué evitar |
|---|---|---|
| **Finch** (selfcare) | Warmth de la mascota, growing visual | Excesiva infantilización |
| **Habitify** | Habit grouping por momento del día | Diseño un poco frío |
| **Headspace** | Brand systems, blob animations | Gradientes saturados de pasada |
| **Streaks (iOS)** | Minimalismo del check + paleta cálida | Excesiva austeridad |
| **Strava** | Heatmap, year-in-review screens | Tone competitivo |
| **Apple Activity** | Anillos como "personaje" | Closed ecosystem |
| **Linear** (no es habits) | Empty states con personalidad | N/A |
| **Notion** | Empty states ilustrados | Densidad info |

## Posicionamiento de marca para informar el visual

> "Hábitos en español, con un coach que sí te escucha. Sin suscripciones abusivas, sin RPGs distractores, sin castigarte por ser humano."

3 pilares visuales que esto traduce:
1. **Cálido, no agresivo** (clay+cream, no rojos saturados, sin "racha PERDIDA en rojo")
2. **Confiable, no manipulador** (no countdowns, no FOMO, no gamification predatoria)
3. **Local, no traducido** (voseo argentino, referencias culturales sutiles si caben)

## Si querés iterar

Mejor empezamos por **Tab Registro + onboarding 1.0/1.1**, que son las pantallas más críticas y más expuestas. Después seguimos por Stats vista Año (más visualmente compleja) y al final completamos los modales y toasts.

¿Qué necesitás antes de empezar? Si necesitás screenshots actuales o el código fuente de algún componente, pedímelo.
