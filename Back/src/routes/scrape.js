// ============================================================
// scrape.js — Rutas hacia MS2 (Scraping)
//
// Según el PDF de comunicación entre servicios (v0.1 — 16/08/2026):
//   POST /api/scrape  →  POST /ms2/scraping
//   El front manda el solicitudId (id1) que obtuvo de MS1.
//   MS2 lee la solicitud de Mongo, scrapea vuelos/hoteles/actividades,
//   persiste en la collection `scraping` y responde con el id2 (scrapingId).
//   El front luego usa ese id2 para llamar a MS3.
//
// Timeout: 30s — MS2 scrapea sitios externos que pueden ser lentos.
// Si falla UNA fuente, MS2 sigue con las demás (ver doc de MS2).
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Timeout propio de MS2: 30s porque scrapea webs externas
const ms2Client = createServiceClient(config.microservices.ms2, config.timeouts.ms2);

// ── POST /api/scrape ─────────────────────────────────────────
// El front manda { solicitudId: "id1" } y el gateway lo reenvía
// sin transformar a MS2.
router.post('/', requireAuth, async (req, res) => {
  try {
    // Ruta interna de MS2 según el PDF: POST /ms2/scraping
    const response = await ms2Client.post('/scraping', req.body, {
      headers: buildInternalHeaders(req),
    });

    // 202 Accepted — el job de scraping arrancó (puede seguir procesando)
    return successResponse(res, response.data, 202);
  } catch (err) {
    console.error(`[${req.requestId}] Error POST /scrape → MS2:`, err.message);

    if (err.code === 'ECONNABORTED') {
      return errorResponse(res, req, {
        ...ERRORS.SERVICE_UNAVAILABLE,
        message: 'MS2 (Scraping) no respondió a tiempo — el scraping puede tardar hasta 30s',
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