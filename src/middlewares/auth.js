import { verifyToken } from '@clerk/backend';
import { config } from '../config.js';
import { errorResponse, ERRORS } from '../utils/response.js';

// El cliente (front) sigue mandando el Bearer token de Clerk, eso no cambió.
// Lo que sí cambió: ya no metemos el userId en el body hacia los micros,
// ahora viaja como header x-user-id (ver utils/internalHeaders.js).
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, req, {
      ...ERRORS.MISSING_TOKEN,
      message: 'Falta el header Authorization con el token de Clerk',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: config.clerkSecretKey,
    });

    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err.reason === 'token-expired') {
      return errorResponse(res, req, {
        ...ERRORS.TOKEN_EXPIRED,
        message: 'El token expiró, el usuario debe volver a iniciar sesión',
      });
    }

    return errorResponse(res, req, {
      ...ERRORS.INVALID_TOKEN,
      message: 'Token inválido',
    });
  }
}
