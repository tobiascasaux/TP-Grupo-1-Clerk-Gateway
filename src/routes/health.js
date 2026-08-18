// ============================================================
// health.js — GET /api/health
// Ruta pública (sin auth). Permite que cualquier equipo verifique
// rápido si el gateway está arriba antes de asumir que el problema
// es propio. También útil para los healthchecks del deploy en Render.
// ============================================================
import { Router } from 'express';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    service: 'gateway',
    requestId: req.requestId, // incluido para poder testear que el middleware de requestId funciona
  });
});

export default router;