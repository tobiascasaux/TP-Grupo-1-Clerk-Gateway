import request from 'supertest';
import { app } from '../src/app.js';

// Este test SÍ levanta la app entera con Supertest, pero /api/health
// no depende de Clerk ni de axios, así que no hace falta mockear nada.
describe('GET /api/health', () => {
  test('responde 200 con status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'gateway' });
  });
});

describe('Ruta no encontrada', () => {
  test('responde 404 con el formato de error acordado', async () => {
    const res = await request(app).get('/api/esto-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });
});
