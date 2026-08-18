// ============================================================
// config.js — Configuración centralizada del gateway
// Lee todo desde variables de entorno (.env).
// Ningún otro archivo del proyecto debería leer process.env directamente.
// ============================================================
import 'dotenv/config';

export const config = {
  // Entorno de ejecución
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // Clerk — autenticación
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,

  // Clave interna compartida entre gateway y microservicios
  // Los micros la validan para asegurarse de que la llamada viene del gateway
  internalKey: process.env.INTERNAL_KEY,

  // MongoDB Atlas
  mongoUri: process.env.MONGO_URI,

  // URLs de los microservicios internos
  // Según puertos acordados en el Notion general del proyecto
  microservices: {
    ms1: process.env.MS1_URL || 'http://localhost:3002', // Encuesta / Solicitudes
    ms2: process.env.MS2_URL || 'http://localhost:3003', // Scraping
    ms3: process.env.MS3_URL || 'http://localhost:3004', // Armado / Planes
  },

  // Timeouts por microservicio (en ms)
  // MS2 y MS3 son más lentos porque dependen de scraping externo y Gemini
  timeouts: {
    ms1: parseInt(process.env.MS1_TIMEOUT) || 10000,
    ms2: parseInt(process.env.MS2_TIMEOUT) || 30000,
    ms3: parseInt(process.env.MS3_TIMEOUT) || 45000,
  },
};