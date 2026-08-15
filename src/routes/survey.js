import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateSurveyPayload } from '../middlewares/validateSurvey.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();
const ms1Client = createServiceClient(config.services.ms1);

// POST /api/survey -> MS1 Encuesta (G2)
router.post('/', requireAuth, validateSurveyPayload, async (req, res) => {
  try {
    const response = await ms1Client.post('/survey', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data, 202); // 202: job aceptado, la IA sigue procesando
  } catch (err) {
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'El servicio de Encuesta (MS1) no respondió',
      service: 'ms1-encuesta',
    });
  }
});

// GET /api/travel-plans/:id -> MS1 Encuesta (G2)
router.get('/travel-plans/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms1Client.get(`/travel-plans/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return errorResponse(res, req, {
        ...ERRORS.NOT_FOUND,
        message: 'No existe el travelPlan solicitado',
        service: 'ms1-encuesta',
      });
    }
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'El servicio de Encuesta (MS1) no respondió',
      service: 'ms1-encuesta',
    });
  }
});

export default router;
