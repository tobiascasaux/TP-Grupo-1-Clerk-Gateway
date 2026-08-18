// Formato estándar de respuesta para errores
// Acordado con los 3 equipos de microservicios

exports.sendError = (res, statusCode, message, requestId) => {
  return res.status(statusCode).json({
    error: true,
    status: statusCode,
    message: message,
    requestId: requestId,
    timestamp: new Date().toISOString(),
  });
};

// Formato estándar para respuestas exitosas
exports.sendSuccess = (res, statusCode, data, requestId) => {
  return res.status(statusCode).json({
    error: false,
    status: statusCode,
    data: data,
    requestId: requestId,
    timestamp: new Date().toISOString(),
  });
};
