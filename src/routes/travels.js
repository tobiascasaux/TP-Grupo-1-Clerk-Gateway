import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// MS3 internamente le pide a MS2 (que a su vez le pide a MS1), así que puede
// tardar la suma de los tres pasos. Timeout más generoso acá.
const TRAVELS_TIMEOUT_MS = 45000;
const ms3Client = createServiceClient(config.services.ms3, TRAVELS_TIMEOUT_MS);

// GET /api/travels/:id -> MS3 Armado (G3)
// Este es el endpoint que devuelve el itinerario final ya armado.
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms3Client.get(`/travels/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el viaje solicitado',
        service: 'ms3-armado',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'El servicio de Armado (MS3) no respondió',
      service: 'ms3-armado',
    });
  }
});

export default router;
