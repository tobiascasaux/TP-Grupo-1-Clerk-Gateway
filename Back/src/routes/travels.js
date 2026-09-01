// ============================================================
// travels.js — Rutas hacia MS3 (Armado / Planes)
//
// ESTADO AL 27/08/2026:
// MS3 expone hoy: POST /api/travel-plans
// Hay una colisión con MS1 (que también usa /api/travel-plans).
// El Gateway rutea /api/travel-plans hacia MS1 por la tabla de ruteo acordada.
// Para conectar con MS3 mañana en la prueba, usamos /api/travels
// que el Gateway rutea a MS3 internamente como /api/travel-plans.
// ⚠️ Confirmar con Team 3 antes de la prueba qué ruta tienen activa.
//
// Timeout: 45s — MS3 llama a Gemini API que puede tardar.
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();
const ms3Client = createServiceClient(config.microservices.ms3, config.timeouts.ms3);

// ── POST /api/travels ─────────────────────────────────────────
// Body: { "scrapingId": "<ObjectId 24 hex>" }
// MS3 espera x-user-id como STRING de Clerk — el gateway ya lo manda así.
// ⚠️ MS3 todavía valida userId como ObjectId — va a dar 400 hasta que lo corrijan.
// Pedir a Team 3 que corran node scripts/seed.js para tener un scrapingId válido.
router.post('/', requireAuth, async (req, res) => {
  try {
    // Intentamos primero /api/travel-plans (ruta actual de MS3)
    // Cambiar a /api/travels cuando MS3 resuelva la colisión de nombres
    const response = await ms3Client.post('/api/travel-plans', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data, 201);
  } catch (err) {
    console.error(`[${req.requestId}] Error POST /travels → MS3:`, err.message);

    if (err.code === 'ECONNABORTED') {
      return errorResponse(res, req, {
        ...ERRORS.SERVICE_UNAVAILABLE,
        message: 'MS3 no respondió a tiempo — Gemini puede tardar hasta 45s',
        service: 'ms3-armado',
      });
    }
    if (err.response?.status === 403) {
      return errorResponse(res, req, {
        ...ERRORS.FORBIDDEN,
        message: 'El recurso pertenece a otro usuario',
        service: 'ms3-armado',
      });
    }
    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el resultado de scraping. Pedirle a Team 3 un scrapingId válido del seed.',
        service: 'ms3-armado',
      });
    }
    if (err.response?.status === 400) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: 'MS3 rechazó el request — posiblemente userId como ObjectId. Avisar a Team 3.',
        service: 'ms3-armado',
      });
    }
    if (err.response?.status === 422) {
      return errorResponse(res, req, {
        code: 'UNPROCESSABLE',
        statusCode: 422,
        message: 'El presupuesto no alcanza para ninguna propuesta',
        service: 'ms3-armado',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'No se pudo conectar con MS3 (Armado)',
      service: 'ms3-armado',
    });
  }
});

// ── GET /api/travels/:id ──────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms3Client.get(`/api/travel-plans/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    console.error(`[${req.requestId}] Error GET /travels/:id → MS3:`, err.message);
    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el plan de viaje solicitado',
        service: 'ms3-armado',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'No se pudo conectar con MS3 (Armado)',
      service: 'ms3-armado',
    });
  }
});

export default router;