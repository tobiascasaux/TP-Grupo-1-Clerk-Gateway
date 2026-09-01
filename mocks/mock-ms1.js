// ============================================================
// mock-ms1.js — Simulador local de MS1 (Encuesta)
// Corre en puerto 3002. Simula exactamente lo que haría MS1 real.
// Usar solo para pruebas locales cuando MS1 no está disponible.
// Correr con: node mock-ms1.js
// ============================================================
import express from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

// Simula POST /solicitudes — crea una encuesta
app.post('/solicitudes', (req, res) => {
  console.log('[MS1 MOCK] Recibí encuesta:', JSON.stringify(req.body, null, 2));
  console.log('[MS1 MOCK] Headers internos:', {
    'x-user-id': req.headers['x-user-id'],
    'x-request-id': req.headers['x-request-id'],
  });

  // Genera un ObjectId falso de 24 hex (mismo formato que Mongo)
  const solicitudId = randomBytes(12).toString('hex');

  res.status(201).json({
    status: 'success',
    id: solicitudId,
    mensaje: 'Encuesta guardada correctamente (MOCK)',
  });
});

// Simula GET /travel-plans/:id
app.get('/travel-plans/:id', (req, res) => {
  console.log('[MS1 MOCK] Consulta encuesta id:', req.params.id);
  res.json({
    status: 'success',
    id: req.params.id,
    fechaSalida: '2026-12-01',
    fechaFin: '2026-12-10',
    lugarSalida: { ciudad: 'Córdoba', pais: 'Argentina' },
    viajeros: { cantidadTotal: 2 },
    mensaje: 'Encuesta encontrada (MOCK)',
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms1-encuesta-mock' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ms1-encuesta-mock' }));

app.listen(3002, '0.0.0.0', () => {
  console.log('[MS1 MOCK] Corriendo en http://localhost:3002');
});