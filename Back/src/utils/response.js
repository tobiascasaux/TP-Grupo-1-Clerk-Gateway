// ============================================================
// response.js — Formato estándar de respuesta
// Acordado con los 3 equipos (ver Notion / contrato de API).
// TODOS los servicios deben responder con esta forma para que
// el front maneje un solo caso de error/éxito.
// ============================================================

// Respuesta de error estándar
// { error: { code, message, service, requestId } }
export function errorResponse(res, req, { code, message, statusCode, service = 'gateway' }) {
  return res.status(statusCode).json({
    error: {
      code,         // ej: "INVALID_PAYLOAD" — para que el front maneje casos distintos
      message,      // ej: "Falta el campo fechaSalida" — para mostrar al usuario
      service,      // ej: "gateway", "ms1-encuesta" — para saber qué servicio falló
      requestId: req.requestId, // para rastrear el error en los logs de todos los equipos
    },
  });
}

// Respuesta exitosa estándar
// Devuelve el data directo, sin wrapper extra — convención REST
export function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

// ============================================================
// Catálogo de errores estándar — sección 5 del contrato de API
// Si necesitás un error nuevo, agregalo acá y avisá a los otros equipos
// para que lo agreguen también en su documentación.
// ============================================================
export const ERRORS = {
  MISSING_TOKEN:       { code: 'MISSING_TOKEN',       statusCode: 401 },
  INVALID_TOKEN:       { code: 'INVALID_TOKEN',       statusCode: 401 },
  TOKEN_EXPIRED:       { code: 'TOKEN_EXPIRED',       statusCode: 401 },
  FORBIDDEN:           { code: 'FORBIDDEN',           statusCode: 403 },
  NOT_FOUND:           { code: 'NOT_FOUND',           statusCode: 404 },
  INVALID_PAYLOAD:     { code: 'INVALID_PAYLOAD',     statusCode: 400 },
  UNPROCESSABLE:       { code: 'UNPROCESSABLE',       statusCode: 422 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', statusCode: 503 },
  INTERNAL_ERROR:      { code: 'INTERNAL_ERROR',      statusCode: 500 },
};