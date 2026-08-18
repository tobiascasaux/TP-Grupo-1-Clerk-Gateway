const { v4: uuidv4 } = require('uuid');

// Middleware que genera un x-request-id único para cada request
// Debe correr primero siempre para que todos los logs tengan el mismo ID
module.exports = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
};
