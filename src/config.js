require('dotenv').config();

module.exports = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // Clerk
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,

  // Internal API Key (para comunicación entre microservicios)
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,

  // Microservicios URLs
  MICROSERVICES: {
    MS1: process.env.MS1_URL || 'http://localhost:3001', // Encuesta / Travel Plans
    MS2: process.env.MS2_URL || 'http://localhost:3002', // Scraper
    MS3: process.env.MS3_URL || 'http://localhost:3003', // Travels
  },

  // Timeouts
  MS_TIMEOUT: parseInt(process.env.MS_TIMEOUT) || 5000,
};
