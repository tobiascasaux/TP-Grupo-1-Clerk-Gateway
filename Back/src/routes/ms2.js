// ============================================================
// ms2.js — Todas las rutas hacia MS2 (Scraping)
// Reemplaza scrape.js y scrapResults.js.
//
// Rutas según el Notion compartido (actualizado 18/08/2026):
//
//   POST /api/scrape              → inicia scraping, manda solicitudId
//   GET  /api/scraping-results/:id → lee resultado guardado en Mongo
//   GET  /api/sugerencias         → autocompletado destino (slug + iata)
//   GET  /api/vuelos              → scrapea vuelos (Kayak)
//   GET  /api/hoteles             → scrapea hoteles (Booking)
//   GET  /api/actividades         → scrapea actividades (Civitatis + Turismocity)
//   POST /api/viaje               → orquestador de prueba, no persiste
//
// Timeouts:
//   Rutas simples (sugerencias, vuelos, hoteles, actividades): 30s
//   POST /api/viaje: 90s — resuelve aeropuerto + 3 scrapers en paralelo
//
// Internamente MS2 corre en puerto 3003 (ver .env.example).
// Las rutas internas NO tienen el prefijo /api (lo agrega el gateway).
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { createServiceClient } from '../utils/httpClient.js';
import { buildInternalHeaders } from '../utils/internalHeaders.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Cliente estándar (30s) para la mayoría de rutas de MS2
const ms2Client = createServiceClient(config.microservices.ms2, config.timeouts.ms2);

// Cliente extendido (90s) solo para POST /api/viaje
// porque resuelve aeropuerto + 3 fuentes en paralelo
const ms2ClientLong = createServiceClient(config.microservices.ms2, 90000);

// ── Helper de errores ─────────────────────────────────────────
// Centraliza el manejo de errores de MS2 para no repetir el mismo
// bloque catch en cada ruta. El parámetro `contexto` aparece en los
// logs para saber exactamente qué ruta falló.
function handleMs2Error(err, req, res, contexto) {
  console.error(`[${req.requestId}] Error ${contexto} → MS2:`, err.message);

  // Timeout — MS2 no respondió a tiempo
  if (err.code === 'ECONNABORTED') {
    return errorResponse(res, req, {
      ...ERRORS.SERVICE_UNAVAILABLE,
      message: `MS2 (Scraping) no respondió a tiempo en ${contexto}`,
      service: 'ms2-scraping',
    });
  }

  // Recurso no encontrado en MS2
  if (err.response?.status === 404) {
    return errorResponse(res, req, {
      ...ERRORS.NOT_FOUND,
      message: 'No existe el recurso solicitado en MS2',
      service: 'ms2-scraping',
    });
  }

  // Un sitio externo (Kayak, Booking, etc.) devolvió algo inválido
  // Según el Notion: esto es 502, no 503
  if (err.response?.status === 502) {
    return errorResponse(res, req, {
      code: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      message: 'Un sitio externo que usa MS2 devolvió algo inválido',
      service: 'ms2-scraping',
    });
  }

  // MS2 caído o no responde
  return errorResponse(res, req, {
    ...ERRORS.SERVICE_UNAVAILABLE,
    message: `No se pudo conectar con MS2 (Scraping) en ${contexto}`,
    service: 'ms2-scraping',
  });
}

// ── POST /api/scrape ─────────────────────────────────────────
// El front manda el solicitudId (id que devolvió MS1).
// MS2 lee la encuesta de Mongo, scrapea las 3 fuentes y guarda
// el resultado en la collection `scrapingResults`.
// Responde 202 porque el scraping puede seguir procesando.
router.post('/scrape', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.post('/scrape', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data, 202);
  } catch (err) {
    return handleMs2Error(err, req, res, 'POST /scrape');
  }
});

// ── GET /api/scraping-results/:id ───────────────────────────
// Lee un scrapingResult ya guardado en Mongo por su id.
// Este es el id que el front recibió como respuesta al POST /scrape.
// Lo usa para pasarle a MS3 (POST /api/travels).
// NOTA: era /scrap-results antes — se unificó a /scraping-results el 18/08.
router.get('/scraping-results/:id', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get(`/scraping-results/${req.params.id}`, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'GET /scraping-results/:id');
  }
});

// ── GET /api/sugerencias ─────────────────────────────────────
// Autocompletado de destino. Devuelve displayName, slug e iata.
// El slug y el iata se usan en /vuelos, /hoteles y /actividades.
// Parámetro obligatorio: ?q=nombre-ciudad
// Ejemplo: GET /api/sugerencias?q=miami
// Respuesta: [{ displayName, slug, cityName, countryName, iata }]
router.get('/sugerencias', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get('/sugerencias', {
      params: req.query, // pasa ?q= tal cual viene del front
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'GET /sugerencias');
  }
});

// ── GET /api/vuelos ──────────────────────────────────────────
// Scrapea vuelos desde Kayak.
// Parámetros obligatorios: origin (IATA), destination (IATA), departDate (YYYY-MM-DD)
// Opcionales: returnDate (YYYY-MM-DD), passengers (default 1)
// Tip: origin acepta lista separada por coma: COR,BUE
// Ejemplo: GET /api/vuelos?origin=COR&destination=MIA&departDate=2026-10-20&returnDate=2026-10-28
router.get('/vuelos', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get('/vuelos', {
      params: req.query,
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'GET /vuelos');
  }
});

// ── GET /api/hoteles ─────────────────────────────────────────
// Scrapea hoteles desde Booking.
// Parámetros obligatorios: destination (nombre de ciudad), checkin, checkout (YYYY-MM-DD)
// Opcional: adults (default 1)
// Ejemplo: GET /api/hoteles?destination=Miami&checkin=2026-10-20&checkout=2026-10-28
router.get('/hoteles', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get('/hoteles', {
      params: req.query,
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'GET /hoteles');
  }
});

// ── GET /api/actividades ─────────────────────────────────────
// Scrapea actividades turísticas desde Civitatis + Turismocity.
// Parámetros obligatorios: destinationSlug (viene de /sugerencias),
// destinationName (nombre legible de la ciudad)
// Ejemplo: GET /api/actividades?destinationSlug=Miami_Estados_Unidos&destinationName=Miami
router.get('/actividades', requireAuth, async (req, res) => {
  try {
    const response = await ms2Client.get('/actividades', {
      params: req.query,
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'GET /actividades');
  }
});

// ── POST /api/viaje ──────────────────────────────────────────
// Orquestador de prueba de MS2: junta vuelos + hoteles + actividades
// en una sola llamada y filtra por presupuesto. NO persiste en Mongo.
// Útil para testing e integración rápida — no reemplaza el flujo real
// que usa MS3 con Gemini para armar los planes finales.
//
// Body requerido:
// {
//   originName, destinationName, destinationSlug,
//   departDate, returnDateStr, passengers, budget
// }
// originIata y destinationIata son opcionales — si no se mandan,
// MS2 los resuelve solo (geocoding) pero tarda más.
//
// Timeout: 90s — resuelve aeropuerto + 3 scrapers en paralelo.
router.post('/viaje', requireAuth, async (req, res) => {
  try {
    const response = await ms2ClientLong.post('/viaje', req.body, {
      headers: buildInternalHeaders(req),
    });
    return successResponse(res, response.data);
  } catch (err) {
    return handleMs2Error(err, req, res, 'POST /viaje');
  }
});

export default router;