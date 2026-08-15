// Helpers para respetar el formato de error acordado con los 3 equipos.
// OJO: el doc conjunto solo define el formato de ERROR explícitamente.
// Para las respuestas exitosas asumimos "devolver el data directo, sin wrapper"
// (convención REST estándar cuando el error sí lleva envelope) -- confirmar
// esto con los otros equipos, quedó como punto abierto.

export function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

export function errorResponse(res, req, { code, message, statusCode, service = 'gateway' }) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      service,
      requestId: req.requestId,
    },
  });
}

// Catálogo de errores y códigos HTTP, según la tabla acordada por los 3 equipos.
export const ERRORS = {
  MISSING_TOKEN: { code: 'MISSING_TOKEN', statusCode: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', statusCode: 401 },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', statusCode: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', statusCode: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', statusCode: 404 },
  INVALID_PAYLOAD: { code: 'INVALID_PAYLOAD', statusCode: 400 },
  UNPROCESSABLE: { code: 'UNPROCESSABLE', statusCode: 422 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', statusCode: 503 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500 },
};
