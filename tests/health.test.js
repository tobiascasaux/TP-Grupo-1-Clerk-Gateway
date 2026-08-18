import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  test('responde 200 con status ok y requestId', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('gateway');
    // requestId confirma que el middleware de trazabilidad está corriendo
    expect(res.body.requestId).toBeDefined();
  });
});

describe('Ruta no encontrada', () => {
  test('responde 404 con el formato de error del contrato', async () => {
    const res = await request(app).get('/api/esto-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.service).toBe('gateway');
    expect(res.body.error.requestId).toBeDefined();
  });
});