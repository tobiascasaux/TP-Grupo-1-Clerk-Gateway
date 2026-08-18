// ============================================================
// auth.js — Autenticación con Clerk
// CLERK VIVE ACÁ Y SOLO ACÁ. Ningún otro archivo del gateway
// debería importar nada de @clerk/express directamente.
//
// Dos piezas:
// 1. clerkMiddleware() — corre globalmente en app.js, deja
//    que Clerk procese el token en TODA request (sin rechazar aún)
// 2. requireAuth — middleware que SÍ rechaza si no hay sesión válida.
//    Se aplica ruta por ruta, solo donde hace falta autenticación.
//
// Flujo:
//   request → clerkMiddleware (procesa token) → requireAuth (valida)
//   → si ok: req.userId disponible para el resto del handler
//   → si falla: 401 con el formato de error estándar del contrato
// ============================================================
import { clerkMiddleware, getAuth } from '@clerk/express';
import { config } from '../config.js';
import { errorResponse, ERRORS } from '../utils/response.js';

// Middleware global — va en app.js antes de todas las rutas.
// No rechaza nada por sí solo, solo deja la sesión disponible en req.
export const initClerk = clerkMiddleware({
  secretKey: config.clerkSecretKey,
  publishableKey: config.clerkPublishableKey,
});

// Middleware de protección — va en cada ruta que requiera auth.
// Si no hay sesión válida, corta acá y nunca llega al microservicio.
export function requireAuth(req, res, next) {
  const auth = getAuth(req);

  // auth.userId es null si el token está ausente, es inválido o expiró
  if (!auth || !auth.userId) {
    return errorResponse(res, req, {
      ...ERRORS.MISSING_TOKEN,
      message: 'Token ausente o inválido. El front debe mandar Authorization: Bearer <token>',
    });
  }

  // Guardamos solo el userId verificado — el token crudo nunca
  // sale de este middleware hacia los microservicios internos
  req.userId = auth.userId;
  next();
}