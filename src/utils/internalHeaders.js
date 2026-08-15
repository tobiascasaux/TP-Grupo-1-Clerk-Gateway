import { config } from '../config.js';

// Centraliza los headers obligatorios que definimos con los 3 equipos.
// Ningún route handler debería armar estos headers a mano.
export function buildInternalHeaders(req) {
  return {
    'x-user-id': req.userId,
    'x-request-id': req.requestId,
    'x-internal-key': config.internalKey,
    'Content-Type': 'application/json',
  };
}
