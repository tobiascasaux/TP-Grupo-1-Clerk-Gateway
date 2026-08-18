// ============================================================
// validateSurvey.js — Validación estructural del payload de encuesta
// Valida la FORMA del JSON antes de mandarlo a MS1, sin entrar
// en lógica de negocio (ej: si el presupuesto "alcanza" para el
// destino — eso es trabajo de MS1/Gemini, no del gateway).
//
// Campos basados en el JSON publicado por Team 2 (MS1 Encuesta).
// PENDIENTE: confirmar con Team 2 si los nombres quedan en español
// o se migran a inglés (acordado originalmente, pero el JSON de
// Team 2 quedó en español). No cambiar unilateralmente.
// ============================================================
import { errorResponse, ERRORS } from '../utils/response.js';

// Máximo de viajeros — definido en el acuerdo del proyecto
const MAX_TRAVELERS = 5;

// Campos que DEBEN estar presentes para que la request tenga sentido
// El gateway rechaza acá antes de gastar tokens de Gemini en MS1
const REQUIRED_FIELDS = ['fechaSalida', 'fechaFin', 'presupuesto', 'viajeros', 'lugarSalida'];

export function validateSurveyPayload(req, res, next) {
  const body = req.body;

  // ── 1. Campos obligatorios presentes ──────────────────────
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: `Falta el campo obligatorio: ${field}`,
      });
    }
  }

  // ── 2. Fechas: formato válido (ISO 8601) ──────────────────
  const fechaSalida = new Date(body.fechaSalida);
  const fechaFin    = new Date(body.fechaFin);

  if (isNaN(fechaSalida.getTime()) || isNaN(fechaFin.getTime())) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'fechaSalida y fechaFin deben ser fechas válidas en formato ISO 8601 (ej: 2026-12-01)',
    });
  }

  // fechaFin no puede ser anterior a fechaSalida
  if (fechaFin < fechaSalida) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'fechaFin no puede ser anterior a fechaSalida',
    });
  }

  // ── 3. Presupuesto: solo estructura, no coherencia semántica ─
  if (typeof body.presupuesto?.monto !== 'number' || body.presupuesto.monto <= 0) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'presupuesto.monto debe ser un número mayor a 0',
    });
  }

  // ── 4. Viajeros: cantidad válida y dentro del límite ───────
  const cantidadTotal = body.viajeros?.cantidadTotal;

  if (typeof cantidadTotal !== 'number' || cantidadTotal < 1) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'viajeros.cantidadTotal debe ser un número mayor a 0',
    });
  }

  if (cantidadTotal > MAX_TRAVELERS) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: `El máximo de viajeros permitido es ${MAX_TRAVELERS}`,
    });
  }

  // ── 5. Lugar de salida: ciudad y país mínimos ──────────────
  // Requeridos por el scraper de vuelos (MS2) para buscar el origen
  if (!body.lugarSalida?.ciudad || !body.lugarSalida?.pais) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'lugarSalida debe incluir al menos ciudad y pais',
    });
  }

  // Todo ok — la request puede seguir hacia MS1
  next();
}