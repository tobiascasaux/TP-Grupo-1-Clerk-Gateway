import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();
const ms2Client = createServiceClient(config.services.ms2);

// GET /api/scrap-results/:id -> MS2 Scraping (G3)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get(`/scrap-results/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el resultado de scraping solicitado',
        service: 'ms2-scraping',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'El servicio de Scraping (MS2) no respondió',
      service: 'ms2-scraping',
    });
  }
});

export default router;
