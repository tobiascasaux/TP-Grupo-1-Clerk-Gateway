// ============================================================
// me.js — GET /api/me
// Devuelve los datos del usuario autenticado consultando Clerk.
// Útil para que el front o los micros obtengan nombre, email e
// imagen sin que el token viaje más allá del gateway.
//
// Requiere auth — el userId sale del token ya verificado.
// ============================================================
import { Router } from 'express';
import { createClerkClient } from '@clerk/express';
import { requireAuth } from '../middlewares/auth.js';
import { successResponse, errorResponse, ERRORS } from '../utils/response.js';
import { config } from '../config.js';

const router = Router();

// Cliente de Clerk para consultas de backend (no es el middleware de auth)
const clerk = createClerkClient({ secretKey: config.clerkSecretKey });

// GET /api/me
// Devuelve: id, email, nombre, imagen del usuario autenticado
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await clerk.users.getUser(req.userId);

    return successResponse(res, {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || null,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      username: user.username,
    });
  } catch (err) {
    console.error(`[${req.requestId}] Error GET /me → Clerk:`, err.message);
    return errorResponse(res, req, {
      ...ERRORS.INTERNAL_ERROR,
      message: 'No se pudo obtener el perfil del usuario desde Clerk',
    });
  }
});

export default router;