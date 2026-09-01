// ============================================================
// app.js — Configuración de Express
// Última actualización: 27/08/2026
//
// ⚠️ OPCIÓN B ACTIVA — limitación conocida documentada:
// Las rutas de MS1 (/api/survey, /api/travel-plans) no requieren
// token de Clerk porque MS1 tiene su propio sistema de auth.
// El x-user-id que manda el gateway no aplica aguas abajo de MS1.
// Pendiente: cuando MS1 adopte Clerk (Opción A), restaurar initClerk
// en esas rutas y agregar requireAuth en survey.js.
// ============================================================
import express from 'express';
import cors from 'cors';
import { attachRequestId } from './middlewares/requestId.js';
import { initClerk } from './middlewares/auth.js';
import healthRoutes from './routes/health.js';
import surveyRoutes from './routes/survey.js';
import ms2Routes from './routes/ms2.js';
import travelsRoutes from './routes/travels.js';
import meRoutes from './routes/me.js';
import { errorResponse, ERRORS } from './utils/response.js';

export const app = express();

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Middlewares globales ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachRequestId);

// ── Rutas ─────────────────────────────────────────────────────

// Pública — sin auth
app.use('/api/health', healthRoutes);

// Perfil de usuario — requiere Clerk
app.use('/api/me', initClerk, meRoutes);

// MS1 — sin Clerk por ahora (Opción B)
// MS1 tiene su propio sistema de auth, no usa el token de Clerk todavía.
// Cuando MS1 adopte Clerk, cambiar a: initClerk, surveyRoutes
app.use('/api/survey',       surveyRoutes);
app.use('/api/travel-plans', surveyRoutes);

// MS2 — requiere Clerk
app.use('/api', initClerk, ms2Routes);

// MS3 — requiere Clerk
app.use('/api/travels', initClerk, travelsRoutes);

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