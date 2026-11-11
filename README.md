# Registro de comidas (nutri-tracker)

Webapp personal (un solo usuario) para registrar comidas con IA, contar calorías y macros,
seguir el peso y analizar episodios de gula/"roto". Next.js 16 (App Router) + TypeScript +
Tailwind + Supabase + OpenRouter + Recharts. Pensada para usar desde el celular.

## 1. Supabase

1. Crea un proyecto en <https://supabase.com> (elige una región cercana, por ejemplo São Paulo).
2. **SQL Editor** → pega y ejecuta `supabase/migrations/0001_init.sql`.
3. **Authentication → Users → Add user → Create new user**: tu email y contraseña, con
   *Auto Confirm User* activado. (La app no tiene registro público.)
4. Desactiva el alta pública de usuarios: en **Authentication → Sign In / Providers** apaga
   *Allow new users to sign up* (el nombre puede variar según la versión del panel).
5. **Project Settings → API**: copia la *Project URL* y la clave *anon* (pública).

## 2. OpenRouter

1. Crea una API key en <https://openrouter.ai/keys> y, si quieres, ponle un límite de gasto.
2. El modelo se define con `OPENROUTER_MODEL` (por defecto `openai/gpt-4o-mini`). Conviene uno
   que soporte salida JSON estructurada; si no, la app cae sola a "JSON puro".

## 3. Correr en local

```bash
npm install
cp .env.local.example .env.local   # completa las variables
npm run dev                        # http://localhost:3000
```

Otros comandos: `npm run typecheck`, `npm run lint`, `npm run build`.

## 4. Deploy en Vercel

1. Sube el proyecto a un repositorio de GitHub (el `.gitignore` ya excluye `.env*`).
2. En <https://vercel.com/new> importa el repo. Vercel detecta Next.js: no cambies nada del build.
3. Antes de desplegar, en **Environment Variables** carga (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role (solo servidor; hoy no se usa) |
   | `OPENROUTER_API_KEY` | tu key de OpenRouter (solo servidor) |
   | `OPENROUTER_MODEL` | por ejemplo `openai/gpt-4o-mini` |
   | `APP_TIMEZONE` | `America/Argentina/Buenos_Aires` |

   Solo las variables `NEXT_PUBLIC_*` llegan al navegador. No marques las demás como públicas.
4. **Deploy**. Si cambias variables después, hay que redesplegar.
5. Opcional: en **Settings → Functions** elige la región de las funciones cerca de la de Supabase.
6. En el celular, abre la URL y usa "Agregar a pantalla de inicio" para tenerla como acceso directo.

### Checklist después del deploy

- [ ] Abrir la URL sin sesión te lleva a `/login`.
- [ ] Entras con el usuario creado en Supabase.
- [ ] En **Ajustes** guardas tus metas (kcal, macros, peso objetivo).
- [ ] En **Hoy** escribes "2 empanadas de carne y una coca zero": aparece la tarjeta de confirmación.
- [ ] Guardas la comida y se actualiza el resumen del día.
- [ ] En **Progreso** registras un peso; en **Análisis** marcas una comida como gula/roto y la ves en los patrones.

## Notas de diseño

- **Fechas:** se guardan en UTC; el "día" siempre se calcula en `America/Argentina/Buenos_Aires`
  (`src/lib/dates.ts` en TypeScript y la función `public.local_day` en SQL). La zona está fija en
  ambos lugares; `APP_TIMEZONE` figura como referencia pero el código no la lee.
- **Seguridad:** RLS en todas las tablas; el middleware (en Next 16 se llama `src/proxy.ts`)
  exige sesión; `/api/parse-meal` verifica sesión y es el único lugar que llama a OpenRouter.
- **Guardado de comidas:** meal + ítems se escriben desde el navegador en dos pasos (no es una
  transacción). Si fallan los ítems al crear, se borra la comida; al editar, se insertan los
  ítems nuevos antes de borrar los viejos.
- **Gasto calórico estimado:** `calorías promedio − variación de la media móvil × 7700 / días`,
  solo con ≥ 14 días con peso y calorías. Es una aproximación.

## Estructura

```
src/
  proxy.ts                     sesión obligatoria (antes "middleware")
  app/
    login/                     pantalla y acciones de login
    (app)/page.tsx             Hoy        (?d=YYYY-MM-DD para otros días)
    (app)/progreso/            peso y calorías (?r=7|30|90|all)
    (app)/analisis/            resumen semanal y patrones (?w=4|8)
    (app)/ajustes/             metas
    api/parse-meal/route.ts    única llamada a OpenRouter
  components/                  ui/, today/, progress/, analysis/, nav/
  lib/                         dates, stats, queries, draft, mealActions, llm/, supabase/
supabase/migrations/           SQL (tablas, enum, RLS, vista daily_totals)
```

### Puntos de extensión (no implementados)

- **Fotos de comida:** `src/lib/llm/` está aislado; se puede agregar un modelo con visión y un
  campo de imagen en `/api/parse-meal` sin tocar el resto.
- **Comidas guardadas:** nueva tabla + un selector en `Composer.tsx`, reutilizando `ConfirmCard`.
- **PWA:** agregar `manifest` e íconos en `src/app` y un service worker.
- **Guardado atómico:** pasar `saveMeal` (`src/lib/mealActions.ts`) a una función RPC de Postgres.

## Problemas frecuentes

- **"No pude interpretar la comida"**: revisa `OPENROUTER_API_KEY`, crédito en OpenRouter y que
  `OPENROUTER_MODEL` exista. El detalle queda en los logs de la función en Vercel.
- **Te manda a `/login` todo el tiempo**: revisa que la URL y la clave anon de Supabase sean las
  del mismo proyecto y que el usuario esté confirmado.
- **No se guardan datos / error de permisos**: confirma que corriste la migración completa (RLS y
  políticas incluidas) y que estás logueado con el usuario que creaste.
