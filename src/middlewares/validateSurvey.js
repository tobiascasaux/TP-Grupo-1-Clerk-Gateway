import { errorResponse, ERRORS } from '../utils/response.js';

// NOTA: los nombres de campo siguen el JSON real que publicó Team 2 (MS1),
// que quedó en español. Pendiente de confirmar en la próxima reunión conjunta
// si se mantiene así o se corrige a inglés — si cambia, este archivo es el
// único lugar que hay que tocar.

const MAX_TRAVELERS = 5;
const REQUIRED_FIELDS = ['fechaSalida', 'fechaFin', 'presupuesto', 'viajeros', 'lugarSalida'];

export function validateSurveyPayload(req, res, next) {
  const body = req.body;

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      return errorResponse(res, req, {
        ...ERRORS.INVALID_PAYLOAD,
        message: `Falta el campo obligatorio: ${field}`,
      });
    }
  }

  // Fechas: validación estructural (formato), no de coherencia semántica
  const fechaSalida = new Date(body.fechaSalida);
  const fechaFin = new Date(body.fechaFin);

  if (isNaN(fechaSalida.getTime()) || isNaN(fechaFin.getTime())) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'fechaSalida y fechaFin deben ser fechas válidas (ISO 8601)',
    });
  }

  if (fechaFin < fechaSalida) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'fechaFin no puede ser anterior a fechaSalida',
    });
  }

  // Presupuesto: solo chequeamos forma, no si el monto "alcanza" (eso es de MS1/MS3)
  if (typeof body.presupuesto.monto !== 'number' || body.presupuesto.monto <= 0) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'presupuesto.monto debe ser un número mayor a 0',
    });
  }

  // Viajeros
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

  // Origen: lugarSalida.ciudad y lugarSalida.pais son obligatorios según el JSON de Team 2
  if (!body.lugarSalida.ciudad || !body.lugarSalida.pais) {
    return errorResponse(res, req, {
      ...ERRORS.INVALID_PAYLOAD,
      message: 'lugarSalida debe incluir al menos ciudad y pais',
    });
  }

  next();
}
