const express = require('express');
const requestIdMiddleware = require('./middlewares/requestId');
const authMiddleware = require('./middlewares/auth');

// Importar rutas
const healthRoutes = require('./routes/health');
const surveyRoutes = require('./routes/survey');
const scrapeRoutes = require('./routes/scrape');
const scrapResultsRoutes = require('./routes/scrapResults');
const travelsRoutes = require('./routes/travels');

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Request ID (corre primero siempre)
app.use(requestIdMiddleware);

// 2. Clerk Auth (corre en todas las rutas)
app.use(authMiddleware);

// 3. Rutas públicas (no requieren autenticación)
app.use('/api', healthRoutes);

// 4. Rutas protegidas (requieren autenticación)
app.use('/api', surveyRoutes);
app.use('/api', scrapeRoutes);
app.use('/api', scrapResultsRoutes);
app.use('/api', travelsRoutes);

// 5. Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: 'Ruta no encontrada',
    requestId: req.id,
  });
});

// 6. Manejo de errores global
app.use((err, req, res, next) => {
  console.error(`[${req.id}] Error no manejado:`, err);
  res.status(err.status || 500).json({
    error: true,
    status: err.status || 500,
    message: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message,
    requestId: req.id,
  });
});

module.exports = app;
