// ============================================================
// survey.js — Rutas hacia MS1 (Encuesta / Solicitudes)
// ⚠️ OPCIÓN B ACTIVA — sin requireAuth por ahora.
// ============================================================
import { response, Router } from 'express';
import { validateSurveyPayload } from '../middlewares/validateSurvey.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();
const ms1Client = createServiceClient(config.microservices.ms1, config.timeouts.ms1);

router.post('/', validateSurveyPayload, async (req, res) => {
  try {
    // ── LOG: qué le mandamos a MS1 ──
    console.log('\n========== POST /api/survey ==========');
    console.log('[GW→MS1] URL destino:', `${config.microservices.ms1}/solicitudes`);
    console.log('[GW→MS1] Headers internos:', {
      'x-user-id':      req.headers['x-user-id'] || '(no hay userId — Opción B)',
      'x-request-id':   req.requestId,
      'x-internal-key': config.internalKey || '(vacío)',
    });
    console.log('[GW→MS1] Body que mandamos:', JSON.stringify(req.body, null, 2));
    console.log('======================================\n');

    const response = await ms1Client.post('/api/conversaciones/mensaje', req.body, {
      headers: buildInternalHeaders(req),
    });

    // ── LOG: qué respondió MS1 ──
    console.log('[MS1→GW] Status:', response.status);
    console.log('[MS1→GW] Respuesta:', JSON.stringify(response.data, null, 2));
    console.log('======================================\n');

    return successResponse(res, response.data, 201);
  } catch (err) {
    // ── LOG: error detallado de MS1 ──
    console.log('\n========== ERROR POST /api/survey ==========');
    console.log('[MS1 ERROR] Status HTTP:', err.response?.status);
    console.log('[MS1 ERROR] Headers respuesta:', err.response?.headers);
    console.log('[MS1 ERROR] Body del error:', JSON.stringify(err.response?.data, null, 2));
    console.log('[MS1 ERROR] Mensaje axios:', err.message);
    console.log('[MS1 ERROR] Código:', err.code);
    console.log('============================================\n');

    if (err.code === 'ECONNABORTED') {
      return errorResponse(res, req, {
        ...ERRORS.SERVICE_UNAVAILABLE,
        message: 'MS1 (Encuesta) no respondió a tiempo',
        service: 'ms1-encuesta',
      });
    }

    if (err.response?.status === 400) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: `MS1 rechazó el payload con 400 — revisar los nombres de campos. Detalle: ${JSON.stringify(err.response?.data)}`,
        service: 'ms1-encuesta',
      });
    }

    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'La ruta /solicitudes no existe en MS1 — confirmar con Team 2 la ruta correcta',
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

router.get('/travel-plans/:id', async (req, res) => {
  try {
    console.log('\n========== GET /api/travel-plans/:id ==========');
    console.log('[GW→MS1] Buscando id:', req.params.id);

    const response = await ms1Client.get(`/travel-plans/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });

    console.log('[MS1→GW] Respuesta:', JSON.stringify(response.data, null, 2));
    return successResponse(res, response.data);
  } catch (err) {
    console.log('[MS1 ERROR] Status:', err.response?.status);
    console.log('[MS1 ERROR] Body:', JSON.stringify(err.response?.data, null, 2));

    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe la encuesta solicitada',
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