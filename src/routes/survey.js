const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { sendError, sendSuccess } = require('../utils/response');
const createHttpClient = require('../utils/httpClient');
const getInternalHeaders = require('../utils/internalHeaders');
const config = require('../config');
const validateSurvey = require('../middlewares/validateSurvey');

const httpClient = createHttpClient();

// POST /api/survey
// Crea una nueva encuesta en MS1
// Body esperado: { surveyData: { ... } }
router.post('/survey', requireAuth, validateSurvey, async (req, res) => {
  try {
    const response = await httpClient.post(
      `${config.MICROSERVICES.MS1}/survey`,
      req.body,
      {
        headers: getInternalHeaders(req),
      }
    );

    sendSuccess(res, response.status, response.data, req.id);
  } catch (error) {
    console.error(`[${req.id}] Error en POST /survey:`, error.message);
    const statusCode = error.response?.status || 500;
    sendError(res, statusCode, 'Error al crear encuesta', req.id);
  }
});

// GET /api/travel-plans/:id
// Obtiene un plan de viaje de MS1
router.get('/travel-plans/:id', requireAuth, async (req, res) => {
  try {
    const response = await httpClient.get(
      `${config.MICROSERVICES.MS1}/travel-plans/${req.params.id}`,
      {
        headers: getInternalHeaders(req),
      }
    );

    sendSuccess(res, response.status, response.data, req.id);
  } catch (error) {
    console.error(`[${req.id}] Error en GET /travel-plans/:id:`, error.message);
    const statusCode = error.response?.status || 500;
    sendError(res, statusCode, 'Error al obtener plan de viaje', req.id);
  }
});

module.exports = router;
