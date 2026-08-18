const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { sendError, sendSuccess } = require('../utils/response');
const createHttpClient = require('../utils/httpClient');
const getInternalHeaders = require('../utils/internalHeaders');
const config = require('../config');

const httpClient = createHttpClient();

// GET /api/travels/:id
// Obtiene información de un viaje de MS3
router.get('/travels/:id', requireAuth, async (req, res) => {
  try {
    const response = await httpClient.get(
      `${config.MICROSERVICES.MS3}/travels/${req.params.id}`,
      {
        headers: getInternalHeaders(req),
      }
    );

    sendSuccess(res, response.status, response.data, req.id);
  } catch (error) {
    console.error(`[${req.id}] Error en GET /travels/:id:`, error.message);
    const statusCode = error.response?.status || 500;
    sendError(res, statusCode, 'Error al obtener viaje', req.id);
  }
});

module.exports = router;
