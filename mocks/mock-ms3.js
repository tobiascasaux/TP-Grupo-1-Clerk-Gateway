// ============================================================
// mock-ms3.js — Simulador local de MS3 (Armado)
// Corre en puerto 3004. Simula exactamente lo que haría MS3 real.
// Usar solo para pruebas locales cuando MS3 no está disponible.
// Correr con: node mock-ms3.js
// ============================================================
import express from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

// Simula POST /api/travels — arma 3 propuestas con Gemini
app.post('/api/travels', (req, res) => {
  console.log('[MS3 MOCK] Recibí scrapingId:', req.body);
  console.log('[MS3 MOCK] Headers:', {
    'x-user-id': req.headers['x-user-id'],
    'x-request-id': req.headers['x-request-id'],
  });

  const travelId = randomBytes(12).toString('hex');

  res.status(201).json({
    status: 'success',
    travelPlan: {
      _id: travelId,
      userId: req.headers['x-user-id'],
      scrapingResultId: req.body.scrapingId,
      destinos: ['Asunción'],
      propuestas: [
        {
          destino: 'Asunción',
          vuelo: { aerolinea: 'Paranair', precio: 185.5 },
          hospedaje: { nombre: 'Hotel Guaraní', precio: 85.0 },
          actividades: [{ nombre: 'City tour', precio: 25.0 }],
          precioEstimado: 295.5,
          moneda: 'USD',
          resumen: 'Escapada cultural 6 días (MOCK propuesta 1)',
        },
        {
          destino: 'Asunción',
          vuelo: { aerolinea: 'Aerolíneas', precio: 210.0 },
          hospedaje: { nombre: 'Hotel Centro', precio: 70.0 },
          actividades: [{ nombre: 'Museo', precio: 15.0 }],
          precioEstimado: 295.0,
          moneda: 'USD',
          resumen: 'Escapada cultural 6 días (MOCK propuesta 2)',
        },
        {
          destino: 'Asunción',
          vuelo: { aerolinea: 'LATAM', precio: 195.0 },
          hospedaje: { nombre: 'Hostel River', precio: 45.0 },
          actividades: [{ nombre: 'Tour gastronómico', precio: 30.0 }],
          precioEstimado: 270.0,
          moneda: 'USD',
          resumen: 'Escapada gastronómica 6 días (MOCK propuesta 3)',
        },
      ],
      geminiModel: 'mock',
      createdAt: new Date().toISOString(),
    },
  });
});

// Simula GET /api/travels/:id
app.get('/api/travels/:id', (req, res) => {
  res.json({ status: 'success', id: req.params.id, mensaje: 'Plan encontrado (MOCK)' });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms3-armado-mock' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ms3-armado-mock' }));

app.listen(3004, '0.0.0.0', () => {
  console.log('[MS3 MOCK] Corriendo en http://localhost:3004');
});