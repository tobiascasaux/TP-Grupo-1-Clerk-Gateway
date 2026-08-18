const { clerkMiddleware, getAuth } = require('@clerk/express');
const config = require('../config');

// Middleware de Clerk para validar tokens JWT
// Corre automáticamente en TODAS las rutas

module.exports = clerkMiddleware({
  secretKey: config.CLERK_SECRET_KEY,
  publishableKey: config.CLERK_PUBLISHABLE_KEY,
});

// Función auxiliar para extraer el usuario de Clerk
// Úsala en tus rutas cuando necesites el usuario autenticado
exports.getUser = (req) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return null;
    }
    return {
      userId: auth.userId,
      sessionId: auth.sessionId,
      orgId: auth.orgId || null,
    };
  } catch (err) {
    return null;
  }
};

// Middleware que protege rutas (rechaza requests sin autenticación válida)
exports.requireAuth = (req, res, next) => {
  const user = exports.getUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
      requestId: req.id,
    });
  }
  req.user = user;
  next();
};
