import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Los scrapers pegan a webs externas: van a tardar más que el default de 10s.
const SCRAPE_TIMEOUT_MS = 30000;
const ms2Client = createServiceClient(config.services.ms2, SCRAPE_TIMEOUT_MS);

// POST /api/scrape -> MS2 Scraping (G3)
router.post('/', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.post('/scrape', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data, 202);
  } catch (err) {
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: 'El servicio de Scraping (MS2) no respondió',
      service: 'ms2-scraping',
    });
  }
});

export default router;
