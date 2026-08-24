// ============================================================
// app.js — Configuración de Express
// Base: repo (18/08/2026)
// Cambios respecto a la base:
//   - scrape.js y scrapResults.js reemplazados por ms2.js
//   - Rutas nuevas de MS2: /sugerencias, /vuelos, /hoteles,
//     /actividades, /viaje, /scraping-results
// ============================================================
import express from 'express';
import cors from 'cors';
import { attachRequestId } from './middlewares/requestId.js';
import { initClerk } from './middlewares/auth.js';
import healthRoutes from './routes/health.js';
import surveyRoutes from './routes/survey.js';
import ms2Routes from './routes/ms2.js';
import travelsRoutes from './routes/travels.js';
import { errorResponse, ERRORS } from './utils/response.js';
// import arriba con los demás
import meRoutes from './routes/me.js';

export const app = express();

// ── CORS ──────────────────────────────────────────────────────
// Permite que el front (Vite en localhost:5173) llame al gateway.
// En producción, FRONTEND_URL debe ser la URL real del deploy del front.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // necesario para que Clerk envíe cookies de sesión
}));

// ── Middlewares globales ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachRequestId); // genera x-request-id — siempre primero

// ── Rutas ─────────────────────────────────────────────────────
// initClerk se aplica POR RUTA, no globalmente — así /api/health
// funciona sin claves de Clerk en tests y healthchecks del deploy.

// Pública — sin auth
app.use('/api/health', healthRoutes);

// MS1 — Encuesta / Solicitudes
app.use('/api/survey',       initClerk, surveyRoutes); // POST → crea encuesta
app.use('/api/travel-plans', initClerk, surveyRoutes); // GET  → lee encuesta por id
// ⚠️ BLOQUEANTE PENDIENTE: MS3 también expone POST /api/travel-plans.
// Con este ruteo ese endpoint de MS3 es inalcanzable desde el gateway.
// No cambiar hasta que se resuelva la colisión del nombre "travelPlan"
// con Nico (ver Acuerdos Abiertos en el Notion compartido).

// MS2 — Scraping (todas las rutas en ms2.js)
// Cubre:
//   POST /api/scrape               → inicia scraping con solicitudId
//   GET  /api/scraping-results/:id → lee resultado de Mongo
//   GET  /api/sugerencias          → autocompletado de destino
//   GET  /api/vuelos               → scrapea vuelos (Kayak)
//   GET  /api/hoteles              → scrapea hoteles (Booking)
//   GET  /api/actividades          → scrapea actividades (Civitatis + Turismocity)
//   POST /api/viaje                → orquestador de prueba (sin persistencia)
app.use('/api', initClerk, ms2Routes);
  // en las rutas, después de health
app.use('/api/me', initClerk, meRoutes);


// MS3 — Armado / Planes
app.use('/api/travels', initClerk, travelsRoutes); // POST/GET → planes finales con Gemini

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  return errorResponse(res, req, {
    ...ERRORS.NOT_FOUND,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

// ── 500 ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error no manejado:`, err);
  return errorResponse(res, req, {
    ...ERRORS.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});