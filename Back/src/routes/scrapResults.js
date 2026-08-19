// ============================================================
// scrapResults.js — GET /api/scrap-results/:id → MS2
// Consulta un resultado de scraping ya guardado por su id2.
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();
const ms2Client = createServiceClient(config.microservices.ms2, config.timeouts.ms2);

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get(`/scrap-results/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    console.error(`[${req.requestId}] Error GET /scrap-results/:id → MS2:`, err.message);

    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el resultado de scraping solicitado',
        service: 'ms2-scraping',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'No se pudo conectar con MS2 (Scraping)',
      service: 'ms2-scraping',
    });
  }
});

export default router;