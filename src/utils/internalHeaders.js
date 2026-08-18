const config = require('../config');

// Arma los headers internos que se envían a los microservicios
// Incluye: user-id del usuario autenticado (Clerk), request-id único y internal-key
module.exports = (req) => {
  return {
    'x-user-id': req.user?.userId || 'anonymous',
    'x-request-id': req.id,
    'x-internal-key': config.INTERNAL_API_KEY,
  };
};
