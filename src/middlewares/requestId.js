import { v4 as uuidv4 } from 'uuid';

// Va PRIMERO en la cadena de middlewares, antes incluso de auth,
// así cualquier error (incluso 401) ya tiene un requestId para loguear.
export function attachRequestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('x-request-id', req.requestId);
  next();
}
