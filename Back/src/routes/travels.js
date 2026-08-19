// ============================================================
// travels.js — Rutas hacia MS3 (Armado / Planes)
//
// Según el PDF de comunicación entre servicios (v0.1 — 16/08/2026):
//   POST /api/travels  →  POST /ms3/planes
//   El front manda el scrapingId (id2) que obtuvo de MS2.
//   MS3 lee el scraping de Mongo, llama a Gemini API y arma
//   3 planes de viaje (vuelo + hotel + actividades).
//   Persiste en la collection `planes` y responde con los 3 planes.
//
// Timeout: 45s — MS3 espera el resultado de MS2 + genera con Gemini.
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Timeout más alto porque MS3 encadena: leer Mongo + llamar a Gemini
const ms3Client = createServiceClient(config.microservices.ms3, config.timeouts.ms3);

// ── POST /api/travels ────────────────────────────────────────
// El front manda { scrapingId: "id2" } y el gateway lo reenvía a MS3.
// MS3 devuelve los 3 planes de viaje para renderizar en el front.
router.post('/', requireAuth, async (req, res) => {
  try {
    // Ruta interna de MS3 según el PDF: POST /ms3/planes
    const response = await ms3Client.post('/planes', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    console.error(`[${req.requestId}] Error POST /travels → MS3:`, err.message);

    if (err.code === 'ECONNABORTED') {
      return errorResponse(res, req, {
        ...ERRORS.SERVICE_UNAVAILABLE,
        message: 'MS3 (Armado) no respondió a tiempo — puede tardar hasta 45s por Gemini',
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

// ── GET /api/travels/:id ─────────────────────────────────────
// Consulta un plan de viaje ya generado por su id.
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms3Client.get(`/planes/${req.params.id}`, {
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