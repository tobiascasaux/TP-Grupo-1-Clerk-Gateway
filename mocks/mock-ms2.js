// ============================================================
// mock-ms2.js — Simulador local de MS2 (Scraping)
// Corre en puerto 3003. Simula exactamente lo que haría MS2 real.
// Usar solo para pruebas locales cuando MS2 no está disponible.
// Correr con: node mock-ms2.js
// ============================================================
import express from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

// Simula POST /scrape — inicia scraping
app.post('/scrape', (req, res) => {
  console.log('[MS2 MOCK] Recibí solicitudId:', req.body);
  console.log('[MS2 MOCK] Headers:', {
    'x-user-id': req.headers['x-user-id'],
    'x-request-id': req.headers['x-request-id'],
  });

  const scrapingId = randomBytes(12).toString('hex');

  res.status(202).json({
    status: 'success',
    id: scrapingId,
    mensaje: 'Scraping iniciado (MOCK)',
  });
});

// Simula GET /scraping-results/:id
app.get('/scraping-results/:id', (req, res) => {
  console.log('[MS2 MOCK] Consulta scraping id:', req.params.id);
  res.json({
    status: 'success',
    scrapingResultId: req.params.id,
    destinos: ['Asunción'],
    vuelos: [{ destino: 'Asunción', price: 185.5, origin: 'COR' }],
    hoteles: [{ destino: 'Asunción', name: 'Hotel Guaraní', price: 85.0 }],
    actividades: [{ destino: 'Asunción', nombre: 'City tour', precio: 25.0 }],
    mensaje: 'Resultado de scraping (MOCK)',
  });
});

// Simula GET /sugerencias
app.get('/sugerencias', (req, res) => {
  res.json({
    status: 'success',
    sugerencias: [
      { displayName: `${req.query.q} (MOCK)`, slug: 'Mock_Destino', iata: 'MCK' }
    ],
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms2-scraping-mock' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ms2-scraping-mock' }));

app.listen(3003, '0.0.0.0', () => {
  console.log('[MS2 MOCK] Corriendo en http://localhost:3003');
});