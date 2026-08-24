# FreeVago — API Gateway (Grupo 1)

Última actualización: 20/08/2026

Punto único de entrada del sistema FreeVago. Valida el token de Clerk, inyecta los headers internos y rutea hacia MS1 (Encuesta), MS2 (Scraping) y MS3 (Armado). No tiene lógica de negocio propia ni base de datos.

---

## Equipos y ownership

| Equipo | Responsable de | Servicios |
|--------|-----------------|-----------|
| **Grupo 1 (nosotros)** | Puerta de entrada y seguridad | API Gateway + Auth (Clerk) |
| Grupo 2 | Captura de intención del usuario e interfaz | MS1 – Encuesta IA + Frontend |
| Grupo 3 | Obtención de datos y producto final | MS2 – Scraping + MS3 – Armado del viaje |

---

## Setup

```bash
npm install
cp .env.example .env   # completar con las claves reales — nunca commitear .env
npm run dev
```

El servidor arranca en `http://localhost:3000` y loguea las URLs de los 3 microservicios al iniciar.

---

## Variables de entorno

Ver `.env.example`. Las obligatorias son:

| Variable | Para qué |
|----------|----------|
| `CLERK_SECRET_KEY` | Validar tokens de Clerk |
| `CLERK_PUBLISHABLE_KEY` | Inicializar Clerk en Express |
| `INTERNAL_KEY` | Header secreto hacia los micros (ver abajo) |
| `FRONTEND_URL` | CORS — URL del front (default: `http://localhost:5173`) |
| `MS1_URL` / `MS2_URL` / `MS3_URL` | URLs internas de los microservicios |

---

## Tabla de rutas (actualizada 20/08/2026)

| Método | Ruta pública | Destino | Auth | Timeout |
|--------|-------------|---------|------|---------|
| GET | `/api/health` | Gateway | No | — |
| POST | `/api/survey` | MS1 | Sí | 10s |
| GET | `/api/travel-plans/:id` | MS1 | Sí | 10s |
| POST | `/api/scrape` | MS2 | Sí | 30s |
| GET | `/api/scraping-results/:id` | MS2 | Sí | 30s |
| GET | `/api/sugerencias?q=` | MS2 | Sí | 30s |
| GET | `/api/vuelos` | MS2 | Sí | 30s |
| GET | `/api/hoteles` | MS2 | Sí | 30s |
| GET | `/api/actividades` | MS2 | Sí | 30s |
| POST | `/api/viaje` | MS2 | Sí | 90s |
| POST | `/api/travels` | MS3 | Sí | 45s |
| GET | `/api/travels/:id` | MS3 | Sí | 45s |

> ⚠️ **Bloqueante pendiente:** MS3 expone `POST /api/travel-plans`, que con esta tabla de ruteo es inalcanzable (va a MS1). Pendiente de resolución con Nico (G3) — ver Acuerdos Abiertos en el Notion.

---

## Cómo funciona Clerk

El front manda el token JWT de Clerk en cada request:
```
Authorization: Bearer <token>
```

El gateway valida el token en `src/middlewares/auth.js` **antes** de reenviar a cualquier microservicio. Si el token es inválido, expira o falta, devuelve `401` y la request nunca llega al micro.

Los microservicios **nunca reciben el token crudo** — reciben el `userId` ya verificado en el header `x-user-id`.

---

## Headers internos (Gateway → micros)

Toda llamada del gateway hacia un microservicio lleva estos 3 headers:

| Header | Valor | Para qué |
|--------|-------|----------|
| `x-user-id` | ID de Clerk del usuario | Saber de quién es el recurso |
| `x-request-id` | UUID generado por el gateway | Trazar el flujo en los logs de los 3 equipos |
| `x-internal-key` | Secreto compartido (env var) | Que nadie llame a un micro salteando el gateway |

> Los microservicios deben validar `x-internal-key` y rechazar con `401` si no coincide. **Estado actual: pendiente de implementación en MS1, MS2 y MS3.**

---

## Formato de error estándar

Todos los servicios responden errores con esta forma:

```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Falta el campo obligatorio: fechaSalida",
    "service": "gateway",
    "requestId": "uuid-del-request"
  }
}
```

Códigos HTTP usados: `200`, `201`, `202`, `400`, `401`, `403`, `404`, `422`, `500`, `502`, `503`.

---

## Estructura del código

```
src/
├── server.js               # levanta el servidor
├── app.js                  # Express, middlewares, rutas
├── config.js               # variables de entorno centralizadas
├── middlewares/
│   ├── requestId.js        # genera x-request-id (corre primero siempre)
│   ├── auth.js             # Clerk vive acá y SOLO acá
│   └── validateSurvey.js   # valida estructura del payload de encuesta
├── routes/
│   ├── health.js           # GET /api/health — sin auth
│   ├── survey.js           # POST /api/survey, GET /api/travel-plans/:id → MS1
│   ├── ms2.js              # todas las rutas de MS2 (scrape, vuelos, hoteles, etc.)
│   └── travels.js          # POST/GET /api/travels → MS3
└── utils/
    ├── response.js         # errorResponse / successResponse / ERRORS
    ├── httpClient.js       # axios con timeout configurable por servicio
    └── internalHeaders.js  # arma los 3 headers obligatorios
```

---

## Tests

```bash
npm test
```

8 tests: validaciones del payload de encuesta (`validateSurvey.test.js`) y healthcheck + rutas inexistentes (`health.test.js`). Corren sin necesitar Clerk ni los otros microservicios levantados.

---

## Puertos locales

| Servicio | Puerto |
|----------|--------|
| API Gateway | 3000 |
| MS1 Encuesta | 3002 |
| MS2 Scraping | 3003 |
| MS3 Armado | 3004 |
| Frontend (Vite) | 5173 |

---

## Pendiente / Bloqueado

| Qué | Bloqueado por | Quién resuelve |
|-----|--------------|----------------|
| Ruta definitiva de MS3 | Colisión de nombre `travelPlan` | Nico (G3) |
| `x-internal-key` del lado de los micros | Sin implementar | G2 y G3 |
| Schema encuesta español vs inglés | Sin decisión | G2 + G3 |
| Precios normalizados a número en MS2 | Deuda técnica | G3 |
| `GET /health` en MS3 | Sin implementar | G3 |