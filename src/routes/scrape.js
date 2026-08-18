const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { sendError, sendSuccess } = require('../utils/response');
const createHttpClient = require('../utils/httpClient');
const getInternalHeaders = require('../utils/internalHeaders');
const config = require('../config');

const httpClient = createHttpClient();

// POST /api/scrape
// Inicia un scraping en MS2
router.post('/scrape', requireAuth, async (req, res) => {
  try {
    const response = await httpClient.post(
      `${config.MICROSERVICES.MS2}/scrape`,
      req.body,
      {
        headers: getInternalHeaders(req),
      }
    );

    sendSuccess(res, response.status, response.data, req.id);
  } catch (error) {
    console.error(`[${req.id}] Error en POST /scrape:`, error.message);
    const statusCode = error.response?.status || 500;
    sendError(res, statusCode, 'Error al iniciar scraping', req.id);
  }
});

module.exports = router;
