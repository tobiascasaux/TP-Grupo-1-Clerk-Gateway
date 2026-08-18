const axios = require('axios');
const config = require('../config');

// Cliente HTTP con timeout configurable para comunicación con microservicios
const createHttpClient = (timeoutMs = config.MS_TIMEOUT) => {
  return axios.create({
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

module.exports = createHttpClient;
