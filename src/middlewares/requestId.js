// ============================================================
// requestId.js — Trazabilidad entre servicios
// Genera un UUID único por cada request que entra al gateway.
// Corre PRIMERO en la cadena de middlewares, antes que auth,
// para que hasta un 401 tenga su requestId en el log.
//
// El ID viaja:
//   - En req.requestId (disponible para todos los handlers)
//   - En el header de respuesta x-request-id (para el front)
//   - En el header x-request-id hacia los microservicios internos
//     (ver utils/internalHeaders.js)
// ============================================================
import { v4 as uuidv4 } from 'uuid';

export function attachRequestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('x-request-id', req.requestId);
  next();
}