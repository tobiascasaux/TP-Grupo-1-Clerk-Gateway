const sendError = require('../utils/response').sendError;

// Valida que la estructura del body de una encuesta sea correcta
module.exports = (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }

  const { surveyData } = req.body;

  if (!surveyData) {
    return sendError(res, 400, 'surveyData es requerido', req.id);
  }

  if (typeof surveyData !== 'object' || Array.isArray(surveyData)) {
    return sendError(res, 400, 'surveyData debe ser un objeto', req.id);
  }

  next();
};
