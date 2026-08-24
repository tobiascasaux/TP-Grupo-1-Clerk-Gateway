// ============================================================
// survey.js — Rutas hacia MS1 (Encuesta / Solicitudes)
//
// Según el PDF de comunicación entre servicios (v0.1 — 16/08/2026):
//   POST /api/survey  →  POST /ms1/solicitudes
//   El front manda los datos del formulario del usuario.
//   MS1 los guarda en la collection `solicitudes` y responde
//   con el id1 (solicitudId) que el gateway reenvía al front.
//   El front luego usa ese id1 para llamar a MS2.
//
//   GET /api/travel-plans/:id  →  GET /ms1/travel-plans/:id
//   Consulta una solicitud ya creada.
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateSurveyPayload } from '../middlewares/validateSurvey.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Cliente HTTP para MS1, con el timeout específico de ese servicio
const ms1Client = createServiceClient(config.microservices.ms1, config.timeouts.ms1);

// ── POST /api/survey ────────────────────────────────────────
// Crea una nueva solicitud de viaje en MS1.
// El gateway valida el payload (validateSurveyPayload) y lo reenvía
// sin transformarlo — MS1 es quien lo persiste en Mongo.
// Responde 201 con el solicitudId para que el front llame a MS2.
router.post('/', requireAuth, validateSurveyPayload, async (req, res) => {
  try {
    // Ruta interna de MS1 según el PDF: POST /ms1/solicitudes
    const response = await ms1Client.post('/solicitudes', req.body, {
      headers: buildInternalHeaders(req),
    });

    // 201 Created — MS1 creó el documento en la collection `solicitudes`
    return successResponse(res, response.data, 201);
  } catch (err) {
    console.error(`[${req.requestId}] Error POST /survey → MS1:`, err.message);

    if (err.code === 'ECONNABORTED') {
      return errorResponse(res, req, {
        ...ERRORS.SERVICE_UNAVAILABLE,
        message: 'MS1 (Encuesta) no respondió a tiempo',
        service: 'ms1-encuesta',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'No se pudo conectar con MS1 (Encuesta)',
      service: 'ms1-encuesta',
    });
  }
});

// ── GET /api/travel-plans/:id ───────────────────────────────
// Consulta una solicitud de viaje existente en MS1 por su id.
router.get('/travel-plans/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms1Client.get(`/travel-plans/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    console.error(`[${req.requestId}] Error GET /travel-plans/:id → MS1:`, err.message);

    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe la solicitud solicitada',
        service: 'ms1-encuesta',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'No se pudo conectar con MS1 (Encuesta)',
      service: 'ms1-encuesta',
    });
  }
});

export default router;