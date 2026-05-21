# HusuAI Coach — arquitectura y opciones de upgrade

## Estado actual (v1.0.3): offline rule-based engine

`src/lib/coach-rules.ts` clasifica intenciones del usuario y compone respuestas
usando los datos reales del historial (patterns, streaks, recap). No requiere
API key, no requiere internet, **costo cero infinito**.

### Cómo funciona

1. `getCoachResponse(question, data)` recibe el texto del usuario + AppData.
2. `classify(question, habits)` retorna `{ intent, habit? }` matcheando keywords:
   - `greet` · `monthly_review` · `weekly_review` · `weekday_pattern`
   - `weakest_habit` · `best_habit` · `streak` · `tip` · `identity`
   - `next_goal` · `specific_habit` (por nombre del hábito) · `celebrate`
   - `thanks` · `fallback`
3. Cada intent tiene un composer dedicado (e.g. `monthlyReview(data)`) que
   pulla datos via `patterns.ts` / `streaks.ts` / `recap.ts` y arma la
   respuesta con plantillas + voseo + datos reales.

### Por qué esto es "AI-suficiente" para una app de hábitos

- **Dominio estrecho**: una app de hábitos tiene ~10-15 preguntas distintas
  que el 95% de usuarios harán siempre. No necesitás un LLM generalista.
- **Datos estructurados**: tenemos historial completo, no texto libre. Un LLM
  haría exactamente lo que ya hacemos — pullar datos + componer texto.
- **Latencia 0**: respuesta instantánea (con delay artificial de 400-800ms
  para sentir que "piensa" 🐼).
- **Privacy**: los datos del usuario nunca salen del dispositivo.
- **Robusto**: no falla por quota, network, API down, key revocada.

### Test cases verificados (de la suite manual)

| Pregunta | Respuesta del motor |
|---|---|
| "hola" | "Buenas tardes 🐼 ¿En qué te puedo ayudar hoy?" |
| "¿cómo voy?" | "Buen mes, 77% en mayo. Lo mejor: 'No fumar' (100%). Lo que más te cuesta: 'Entrenar' (39%)." |
| "¿qué día fallo más?" | "Para 'Entrenar', los domingos cumple solo 0% (vs 75% el mejor día). Mirá qué pasa esos días — ¿menos energía? ¿más distracciones? El cue importa más que la motivación." |
| "¿qué hábito necesita atención?" | "'Entrenar' es el que más te cuesta (39% este mes). Bajá la barra: hacelo aunque sea 2 minutos. Lo que importa es no romper la identidad." |
| "dame un consejo" | Mix de insight personalizado (50%) + tip de Atomic Habits/Tiny Habits (50%) |
| "¿cuál es mi mejor hábito?" | "'No fumar' va al frente: 22 días de racha (tu mejor histórica: 97). Eso es identidad construida, no esfuerzo. Cuidalo." |
| "¿cuál es mi racha?" | Lista top 3 hábitos con días de racha activa |
| "qué tal va leer" | Stats específicos de "Leer 20 minutos": mes + racha actual + mejor racha |
| "¿cuánto falta para mi meta?" | "Lo más cerca: 'Meditar 10 min' — te quedan 5 días para llegar a la meta (20/25)." |
| "gracias" | "Cuando quieras 🐼" |

---

## Opción de upgrade: real LLM via proxy Vercel/Cloudflare

Si el rule-based engine se queda corto para algún caso de uso (preguntas muy
abiertas, conversaciones largas, análisis cualitativo de notas), podemos
sumar real AI **sin embeber API key en la app**.

### Por qué un proxy y no llamar directo desde la app

Embeber la key en el bundle:
- ❌ Es reverse-engineerable (bundle JS es texto plano)
- ❌ Cualquiera puede sacarla y abusarla
- ❌ Apple rechaza apps que llaman APIs con keys hardcoded por TOS
- ❌ Quota se agota por atacantes

Proxy server-side:
- ✅ Key encriptada en variables de entorno del server
- ✅ Rate limiting por IP/device
- ✅ Audit log de quién consume
- ✅ Free tier de Vercel (100k requests/mes) + Gemini (1500/día) = gratis para
  miles de usuarios casuales

### Setup paso a paso

1. **Crear proyecto Vercel** vinculado a tu cuenta. Usar el mismo repo HUSU o
   uno separado tipo `husu-api`.

2. **Estructura**:
   ```
   api/
   └── coach.ts
   ```

3. **api/coach.ts**:
   ```ts
   import type { VercelRequest, VercelResponse } from '@vercel/node';

   const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

   // Rate limit simple en memoria. Para producción usar Redis/Upstash.
   const buckets = new Map<string, { count: number; resetAt: number }>();
   const LIMIT = 30; // requests por hora por IP
   const WINDOW_MS = 60 * 60 * 1000;

   function checkRate(ip: string): boolean {
     const now = Date.now();
     const b = buckets.get(ip);
     if (!b || b.resetAt < now) {
       buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
       return true;
     }
     if (b.count >= LIMIT) return false;
     b.count++;
     return true;
   }

   export default async function handler(req: VercelRequest, res: VercelResponse) {
     // CORS para la app
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
     if (req.method === 'OPTIONS') return res.status(200).end();
     if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

     const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
     if (!checkRate(ip)) return res.status(429).json({ error: 'Rate limit. Probá de nuevo en 1h.' });

     const key = process.env.GEMINI_API_KEY;
     if (!key) return res.status(500).json({ error: 'Server config missing' });

     try {
       const r = await fetch(`${GEMINI_URL}?key=${key}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           contents: req.body.contents,
           generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
         }),
       });
       const json = await r.json();
       const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
       if (!text) return res.status(500).json({ error: 'Empty response' });
       return res.status(200).json({ text });
     } catch (e: any) {
       return res.status(500).json({ error: e.message });
     }
   }
   ```

4. **Variables Vercel**: en el dashboard → Settings → Environment Variables:
   - `GEMINI_API_KEY` = tu key de aistudio.google.com/apikey

5. **Deploy**: `vercel --prod` o push a main si está conectado a GitHub.

6. **Endpoint final**: `https://<tu-app>.vercel.app/api/coach`

7. **En la app Husu** (cuando quieras activarlo):
   - Cambiar `src/lib/gemini.ts` para que llame a tu endpoint en vez de directo
     a Google.
   - Hybrid mode: si `data.geminiKey` no está set, usar el proxy. Si está set,
     usar la key del user. Best of both worlds.

### Costos reales año 1 (estimado)

| Servicio | Free tier | Husu uso esperado | Costo extra |
|---|---|---|---|
| Vercel Functions | 100k invocaciones/mes | ~5-10k/mes | $0 |
| Gemini API | 1500 req/día | ~200-500/día | $0 |
| Vercel bandwidth | 100GB/mes | ~1-5GB/mes | $0 |
| **Total** | | | **$0 USD** |

Si llegás a 50k DAU activos, ahí sí pagás $20/mes Vercel Pro. Pero para
validar producto y crecer orgánico, free tier es más que suficiente.

### Cuándo activar el proxy

Triggers para considerar real AI:
- Notas usuarios que escriben preguntas muy abiertas que el rule-based no entiende
- Querés feature de "weekly insight" con análisis cualitativo
- Sumás voice input (transcripción + LLM)
- Reviews de App Store mencionan que el "AI Coach" no es real AI

Mientras tanto, **rule-based engine cubre el 95% del valor real** con cero
fricción de setup y cero costo operacional.

---

## Decisión de producto

**Recomendación**: lanzar v1 con rule-based. Activar el proxy en v1.5 si los
usuarios lo piden o si el research muestra que conversaciones más largas
generan más engagement.

**Por qué**: el rule-based ya da respuestas que se sienten "inteligentes"
porque usa datos reales del usuario. Lo que diferencia a un coach IA bueno de
un chatbot vacío no es el modelo subyacente — es **cuánto sabe de vos**. Y
acá sabemos todo.
