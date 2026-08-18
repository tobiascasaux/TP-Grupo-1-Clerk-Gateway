// ============================================================
// internalHeaders.js — Headers obligatorios para llamadas internas
// Todo llamado Gateway → microservicio (y micro → micro) debe
// llevar estos 3 headers. Ver sección "Reglas de comunicación"
// del Notion general del proyecto.
//
// x-user-id:      ID del usuario ya verificado por Clerk.
//                 Los micros lo usan para saber de quién es el recurso.
// x-request-id:   UUID generado al inicio del request.
//                 Permite rastrear un flujo completo en los logs
//                 de los 3 equipos simultáneamente.
// x-internal-key: Secreto compartido entre gateway y micros.
//                 Los micros validan este header para rechazar
//                 llamadas directas que saltean el gateway.
// ============================================================
import { config } from '../config.js';

export function buildInternalHeaders(req) {
  return {
    'x-user-id':      req.userId,
    'x-request-id':   req.requestId,
    'x-internal-key': config.internalKey,
    'Content-Type':   'application/json',
  };
}