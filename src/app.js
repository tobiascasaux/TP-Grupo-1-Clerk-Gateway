import express from 'express';
import { attachRequestId } from './middlewares/requestId.js';
import healthRoutes from './routes/health.js';
import surveyRoutes from './routes/survey.js';
import scrapeRoutes from './routes/scrape.js';
import scrapResultsRoutes from './routes/scrapResults.js';
import travelsRoutes from './routes/travels.js';
import { errorResponse, ERRORS } from './utils/response.js';

export const app = express();

app.use(express.json());
app.use(attachRequestId); // primero de todos, para que hasta un 401 tenga requestId

// Prefijo /api sin versión, según el acuerdo conjunto de los 3 equipos
app.use('/api/health', healthRoutes);
app.use('/api/survey', surveyRoutes);       // POST /api/survey            -> MS1
app.use('/api/travel-plans', surveyRoutes); // GET  /api/travel-plans/:id  -> MS1
app.use('/api/scrape', scrapeRoutes);           // POST /api/scrape             -> MS2
app.use('/api/scrap-results', scrapResultsRoutes); // GET /api/scrap-results/:id -> MS2
app.use('/api/travels', travelsRoutes);     // GET  /api/travels/:id       -> MS3
// /api/auth/* lo maneja directamente Clerk del lado del front en muchos setups;
// si necesitan proxyear algo puntual de auth, se agrega acá.

app.use((req, res) => {
  return errorResponse(res, req, {
    ...ERRORS.NOT_FOUND,
    message: 'Ruta no encontrada',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  return errorResponse(res, req, {
    ...ERRORS.INTERNAL_ERROR,
    message: 'Error interno del servidor',
  });
});
