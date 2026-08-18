// ============================================================
// app.js — Configuración de Express
// ============================================================
import express from 'express';
import { attachRequestId } from './middlewares/requestId.js';
import { initClerk } from './middlewares/auth.js';
import healthRoutes from './routes/health.js';
import surveyRoutes from './routes/survey.js';
import scrapeRoutes from './routes/scrape.js';
import scrapResultsRoutes from './routes/scrapResults.js';
import travelsRoutes from './routes/travels.js';
import { errorResponse, ERRORS } from './utils/response.js';

export const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachRequestId);

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/health',        healthRoutes);                   // pública
app.use('/api/survey',        initClerk, surveyRoutes);
app.use('/api/travel-plans',  initClerk, surveyRoutes);
app.use('/api/scrape',        initClerk, scrapeRoutes);
app.use('/api/scrap-results', initClerk, scrapResultsRoutes);
app.use('/api/travels',       initClerk, travelsRoutes);

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