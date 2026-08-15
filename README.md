# FreeVago — API Gateway (Grupo 1)

Contexto completo del sistema y de este repo, para que cualquiera del equipo (o de otro equipo) pueda entender qué hace esto sin tener que preguntar todo desde cero.

## Qué es FreeVago

App que le arma a un usuario un viaje a medida: el usuario responde una encuesta (fechas, presupuesto, origen, cantidad de personas, preferencias), el sistema scrapea vuelos, hoteles y actividades de distintos sitios, y devuelve un itinerario final armado y presupuestado.

**Plazo del proyecto:** ~4 semanas.

## Equipos y ownership

| Equipo | Integrantes | Responsable de | Servicios |
|--------|--------------|-----------------|-----------|
| **Grupo 1 (nosotros)** | Nacho, Ignacio, Lazaro, Alan, Tobi, Mati | Puerta de entrada y seguridad | API Gateway + Auth (Clerk) |
| Grupo 2 | Gabi, Igna, Fran, Vero, Agus, Nati, Alejo | Captura de intención del usuario e interfaz | MS1 – Encuesta IA + Frontend |
| Grupo 3 | Facu, Nico, Sasha, Ale, Luca | Obtención de datos y producto final | MS2 – Scraping + MS3 – Armado del viaje |

Cada equipo es dueño absoluto de su repo, su despliegue y sus colecciones en Mongo. Nadie toca código ni colecciones de otro equipo sin avisar. Un repo por servicio.

**Stack general del proyecto:** Node.js, MongoDB Atlas (cluster compartido, free tier), Gemini 3.5 (IA), Clerk (auth), Cloudinary (imágenes), HTTP/REST con JSON.

## Arquitectura general

El Gateway es un proceso independiente: solo rutea, valida el token y reenvía. No tiene lógica de negocio propia ni base de datos.

```
Usuario → Frontend (G2) → [Bearer token] → API Gateway (nosotros)
                                                  │
                          valida token con Clerk (middleware interno, NO es un proceso aparte)
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                              ▼                              ▼
              MS1 Encuesta IA (G2)          MS2 Scraping (G3)            MS3 Armado (G3)
                    │                              │                              │
                    └──────────────────────────────┴──────────────────────────────┘
                                                  │
                                          MongoDB Atlas
```

**Cadena de dependencia real entre microservicios** (no la maneja el Gateway, es interno entre G2 y G3):

```
MS1 (encuesta) ──▶ MS2 (scraping) ──▶ MS3 (armado final)
   travelPlan        scrapResult         travel
```

MS3 no le pega directo a MS1 — si necesita un dato de la encuesta, lo saca del `travelPlanId` embebido dentro del `scrapResult` que le da MS2.

## Qué hace este Gateway, específicamente

- Valida el JWT de Clerk en toda request (salvo rutas públicas como health)
- Inyecta los headers `x-user-id` y `x-request-id` hacia los microservicios — **el token de Clerk nunca sale del middleware `auth.js`**, los demás servicios solo reciben el `userId` ya verificado
- Rutea por prefijo `/api`, **sin transformar el body** — lo que manda el front le llega tal cual a MS1/MS2/MS3
- Devuelve `401` si el token es inválido, `503` si el micro destino no responde, `400` si el payload no tiene la forma esperada

## Tabla de ruteo

| Ruta pública | Destino | Auth requerida |
|--------------|---------|-----------------|
| `/api/survey` (POST), `/api/travel-plans/:id` (GET) | MS1 | Sí |
| `/api/scrape` (POST), `/api/scrap-results/:id` (GET) | MS2 | Sí |
| `/api/travels/:id` (GET) | MS3 | Sí |
| `/api/health` | Gateway | No |

## Headers obligatorios en toda llamada interna (Gateway → micro)

| Header | Valor | Para qué |
|--------|-------|----------|
| `x-user-id` | ID de Clerk del usuario | Saber de quién es el recurso |
| `x-request-id` | UUID generado en el Gateway | Trazar un flujo completo en los logs entre los 3 equipos |
| `x-internal-key` | Secreto compartido (env var) | Que nadie llame a un micro salteando el Gateway |

## Formato de error (todos los servicios lo respetan)

```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Falta el campo obligatorio: fechaSalida",
    "service": "gateway",
    "requestId": "3f2a-..."
  }
}
```

## Setup

```bash
npm install
cp .env.example .env   # completar con las claves reales, nunca commitear .env
npm run dev
```

## Variables de entorno

Ver `.env.example`. Necesita `CLERK_SECRET_KEY`, `INTERNAL_KEY` (compartida con MS1/MS2/MS3), `MONGO_URI` y las URLs de los 3 microservicios (`MS1_URL`, `MS2_URL`, `MS3_URL`).

## Puertos locales

| Servicio | Puerto |
|----------|--------|
| API Gateway + Auth | 3000 |
| MS1 Encuesta | 3002 |
| MS2 Scraping | 3003 |
| MS3 Armado | 3004 |
| Frontend | 5173 |

## Estructura del código

```
src/
├── server.js            # levanta el servidor
├── app.js               # arma Express, monta middlewares y rutas
├── config.js             # lee .env
├── middlewares/
│   ├── requestId.js      # genera x-request-id, corre primero siempre
│   ├── auth.js            # Clerk vive acá y SOLO acá
│   └── validateSurvey.js # valida estructura del payload de encuesta (no semántica de negocio)
├── routes/
│   ├── health.js
│   ├── survey.js          # -> MS1
│   ├── scrape.js          # -> MS2
│   ├── scrapResults.js   # -> MS2
│   └── travels.js         # -> MS3
└── utils/
    ├── response.js         # formato de error/éxito estándar
    ├── httpClient.js        # axios con timeout configurable por ruta
    └── internalHeaders.js  # arma los 3 headers obligatorios
```

## Tests

```bash
npm test
```

8 tests: validaciones del payload de encuesta (`validateSurvey.test.js`) y healthcheck + manejo de rutas inexistentes (`health.test.js`). Ambos corren sin necesitar Clerk ni los otros microservicios levantados.

## Qué está sólido vs. qué es provisorio

**Estable, no debería requerir cambios grandes:** `app.js`, `server.js`, `config.js`, `requestId.js`, `internalHeaders.js`, `httpClient.js`, `response.js`.

**Provisorio / pendiente de confirmar con otros equipos:**
- `validateSurvey.js` — los nombres de campo (`fechaSalida`, `presupuesto`, etc.) siguen el JSON real que publicó Team 2, que quedó en **español**. El equipo había acordado inglés antes — **pendiente de resolver en la próxima reunión conjunta**, no cambiar unilateralmente.
- `scrape.js` y `travels.js` — el path y el shape del body son un placeholder razonable, falta confirmar con Team 3 cuando cierren su contrato real.
- `auth.js` — funciona, pero es la pieza que hay que sincronizar con lo que ya venís armando vos con Clerk. Si tenés una forma distinta de estructurarlo, avisame antes de pisarlo.

## Puntos abiertos para la próxima reunión con Team 2 y Team 3

1. Idioma de los nombres de campo: inglés (acordado originalmente) vs español (lo que ya publicó Team 2)
2. Formato exacto de respuesta **exitosa** — el doc conjunto solo define el formato de error
3. El puerto `3001` seguía listado para "Auth" como si fuera un proceso aparte — ya no aplica, Auth es middleware dentro del Gateway
4. `presupuesto.moneda` en el JSON de Team 2 permite variar, pero el acuerdo general dice "todo en USD internamente" — confirmar si `moneda` siempre va a ser `"USD"` fijo
