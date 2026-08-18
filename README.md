# 🚀 Freevago API Gateway

**Punto único de entrada para todas las peticiones del sistema Freevago.**

El gateway valida la identidad del usuario con **Clerk** y redirecciona cada request al microservicio correcto. Ningún microservicio interno debe ser accesible directamente desde el frontend — siempre pasa por acá primero.

---

## 🎯 ¿Qué es este proyecto?

Este es un **API Gateway** (puerta de entrada) que:
- ✅ Autentica usuarios con **Clerk**
- ✅ Genera un ID único para cada request (trazabilidad)
- ✅ Redirecciona peticiones a los microservicios correctos
- ✅ Mantiene logs y headers internos consistentes
- ✅ Protege los microservicios internos

---

## 📦 Instalación

### 1. Clonar el repo
```bash
git clone https://github.com/tu-equipo/TP-Grupo-1-Clerk-Gateway.git
cd TP-Grupo-1-Clerk-Gateway
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` y rellena los valores reales:

```env
# === CLERK (Lo más importante) ===
CLERK_SECRET_KEY=sk_live_abc123xyz...
CLERK_PUBLISHABLE_KEY=pk_live_abc123xyz...

# === Gateway ===
PORT=3000
NODE_ENV=development
INTERNAL_API_KEY=tu-clave-interna-secreta

# === URLs de Microservicios ===
MS1_URL=http://localhost:3001        # Encuesta / Travel Plans
MS2_URL=http://localhost:3002        # Scraper
MS3_URL=http://localhost:3003        # Travels
```

**¿De dónde saco las claves de Clerk?**
1. Ve a [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Crea una aplicación
3. Ve a "API Keys"
4. Copia `CLERK_SECRET_KEY` y `CLERK_PUBLISHABLE_KEY`

---

## 🚀 Correr el proyecto

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se levantará en `http://localhost:3000`

---

## 📝 Estructura del proyecto

```
gateway/
├── .env.example          ← Variables de configuración (sin valores reales)
├── .gitignore            ← Qué archivos ignora Git
├── README.md             ← Este archivo
├── package.json          ← Dependencias
│
└── src/
    ├── server.js         ← Levanta el servidor
    ├── app.js            ← Configura Express y middlewares
    ├── config.js         ← Lee variables del .env
    │
    ├── middlewares/
    │   ├── requestId.js  ← Genera ID único para cada request
    │   ├── auth.js       ← ⭐ CLERK VIVE ACÁ (autenticación)
    │   └── validateSurvey.js ← Valida formato de encuestas
    │
    ├── routes/
    │   ├── health.js     ← GET /api/health (verificar que funciona)
    │   ├── survey.js     ← POST /api/survey (crea encuesta)
    │   ├── scrape.js     ← POST /api/scrape (inicia scraping)
    │   ├── scrapResults.js ← GET /api/scrap-results/:id
    │   └── travels.js    ← GET /api/travels/:id
    │
    └── utils/
        ├── response.js   ← Formato estándar de respuestas
        ├── httpClient.js ← Cliente HTTP con timeout
        └── internalHeaders.js ← Headers para comunicación interna
```

---

## 🔐 Cómo funciona Clerk (Autenticación)

### 1. El frontend debe enviar el token
El frontend (React/Vue/etc) obtiene un token JWT de Clerk y lo envía en cada request:

```javascript
// Desde el frontend (React ejemplo)
import { useAuth } from "@clerk/react";

const { getToken } = useAuth();
const token = await getToken();

fetch("http://localhost:3000/api/survey", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ surveyData: {...} }),
});
```

### 2. El gateway valida el token
El middleware de Clerk (en `src/middlewares/auth.js`) valida automáticamente el token en TODAS las rutas.

Si el token es válido:
- ✅ Se guarda el `userId` en `req.user.userId`
- ✅ La petición continúa

Si el token es inválido, expirado o está ausente:
- ❌ El gateway responde con **401 Unauthorized**
- ❌ No se redirige al microservicio

### 3. Ejemplo de petición valida

```bash
curl -X POST http://localhost:3000/api/survey \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"surveyData": {"destino": "Mendoza"}}'
```

---

## 🛣️ Rutas disponibles

### Pública (sin autenticación)
```
GET /api/health
```
Devuelve `{status: "ok"}` si el gateway funciona.

### Protegidas (requieren token de Clerk)

```
POST /api/survey
Body: { "surveyData": {...} }
→ Redirecciona a MS1
```

```
GET /api/travel-plans/:id
→ Redirecciona a MS1
```

```
POST /api/scrape
Body: { "url": "...", "selector": "..." }
→ Redirecciona a MS2
```

```
GET /api/scrap-results/:id
→ Redirecciona a MS2
```

```
GET /api/travels/:id
→ Redirecciona a MS3
```

---

## 🔗 Headers internos (entre gateway y microservicios)

El gateway agrega automáticamente estos headers en cada petición a los microservicios:

```
x-user-id: 12345              (del token de Clerk)
x-request-id: abc-123-def-456 (ID único)
x-internal-key: tu-clave-secreta
```

Los microservicios pueden usar estos headers para:
- Saber quién hizo la petición (`x-user-id`)
- Loguear y debuguear (`x-request-id`)
- Verificar que la petición viene del gateway (`x-internal-key`)

---

## 📊 Ejemplo: Crear una nueva ruta

Si el equipo de Encuesta necesita agregar una nueva ruta, aquí te muestro cómo:

### 1. Crear el archivo de ruta

Crea `src/routes/nuevoEndpoint.js`:
```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/response');
const createHttpClient = require('../utils/httpClient');
const getInternalHeaders = require('../utils/internalHeaders');
const config = require('../config');

const httpClient = createHttpClient();

// POST /api/nuevo-endpoint
router.post('/nuevo-endpoint', requireAuth, async (req, res) => {
  try {
    // Hacer petición a MS1
    const response = await httpClient.post(
      `${config.MICROSERVICES.MS1}/nuevo-endpoint`,
      req.body,
      { headers: getInternalHeaders(req) }
    );

    sendSuccess(res, response.status, response.data, req.id);
  } catch (error) {
    console.error(`[${req.id}] Error:`, error.message);
    sendError(res, error.response?.status || 500, 'Error', req.id);
  }
});

module.exports = router;
```

### 2. Registrar la ruta en `app.js`

En `src/app.js`, agrega:
```javascript
const nuevoRoutes = require('./routes/nuevoEndpoint');
app.use('/api', nuevoRoutes);
```

### 3. Listo ✅

Ya está disponible en `POST /api/nuevo-endpoint`

---

## 🧪 Testing (Pruebas)

Para probar el gateway, usa Postman, Insomnia o curl:

### Con curl
```bash
# 1. Obtén un token de Clerk
TOKEN="tu-token-jwt-aqui"

# 2. Haz una petición autenticada
curl -X POST http://localhost:3000/api/survey \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"surveyData": {"destino": "Bariloche"}}'
```

### Con Postman
1. Obtén un token de Clerk
2. En la pestaña "Headers", agrega:
   - Key: `Authorization`
   - Value: `Bearer tu-token-jwt-aqui`
3. Haz la petición

---

## 🐛 Debugging

### Ver logs en tiempo real
```bash
npm run dev
```

### Ver el request ID
En los logs verás algo como:
```
[abc-123-def-456] Error en POST /survey: Connect timeout
```

Ese ID (`abc-123-def-456`) también está en la respuesta JSON de error. Úsalo para debuguear qué pasó.

### Verificar que Clerk está configurado
```bash
curl http://localhost:3000/api/health
```

Debe responder con:
```json
{
  "error": false,
  "status": 200,
  "data": {"status": "ok"},
  "requestId": "...",
  "timestamp": "2026-08-17T..."
}
```

---

## ⚙️ Configuración avanzada

### Cambiar puerto
En `.env`:
```
PORT=4000
```

### Cambiar URLs de microservicios
En `.env`:
```
MS1_URL=http://192.168.1.100:3001
MS2_URL=http://192.168.1.101:3002
MS3_URL=http://192.168.1.102:3003
```

### Cambiar timeout de conexión
En `.env`:
```
MS_TIMEOUT=10000  # 10 segundos en lugar de 5
```

---

## 📚 Referencias útiles

- **Clerk Docs**: https://clerk.com/docs
- **Express.js**: https://expressjs.com/
- **JWT Token**: https://jwt.io/

---

## 🤝 Preguntas frecuentes

### ¿Por qué necesito Clerk?
Clerk maneja autenticación de usuarios de forma segura. No tienes que guardar contraseñas ni manejar tokens manualmente.

### ¿Qué pasa si el token es inválido?
El gateway responde con `401 Unauthorized` y no redirecciona al microservicio.

### ¿Qué pasa si un microservicio está caído?
El gateway intenta conectar, espera el timeout (5 segundos por defecto) y responde con un error `500`.

### ¿Puedo testear sin token?
Para `GET /api/health` sí. Para cualquier otra ruta, necesitas un token válido de Clerk.

### ¿Cómo agrego una nueva ruta?
Crea un archivo en `src/routes/`, define los endpoints con `requireAuth`, y regístralo en `src/app.js`.

---

## 📞 Soporte

Si el equipo tiene problemas:
1. Verifica que `.env` tiene las claves de Clerk correctas
2. Verifica que los microservicios están corriendo
3. Mira los logs con `npm run dev`
4. Usa el `request-id` para debuguear

---

**¡Listo para integrar Clerk en tu sistema Freevago!** 🎉
