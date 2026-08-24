import { jest } from '@jest/globals';
import { validateSurveyPayload } from '../src/middlewares/validateSurvey.js';

// Payload válido de referencia, según el JSON real que publicó Team 2 (MS1).
// Cada test parte de esto y rompe UN campo a la vez.
function buildValidBody(overrides = {}) {
  return {
    fechaSalida: '2026-12-01',
    fechaFin: '2026-12-10',
    presupuesto: { monto: 1500, moneda: 'USD', incluyeTransporte: true },
    viajeros: { cantidadTotal: 4, personas: [{ edad: 34, tipo: 'adulto' }] },
    lugarSalida: { ciudad: 'Córdoba', pais: 'Argentina' },
    ...overrides,
  };
}

// Mock mínimo de req/res/next -- no hace falta levantar Express para esto.
function mockReqRes(body) {
  const req = { body, requestId: 'test-request-id' };
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('validateSurveyPayload', () => {
  test('deja pasar un payload válido', () => {
    const { req, res, next } = mockReqRes(buildValidBody());
    validateSurveyPayload(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  test('rechaza si falta fechaSalida', () => {
    const body = buildValidBody();
    delete body.fechaSalida;
    const { req, res, next } = mockReqRes(body);

    validateSurveyPayload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.error.code).toBe('INVALID_PAYLOAD');
  });

  test('rechaza si fechaFin es anterior a fechaSalida', () => {
    const body = buildValidBody({ fechaSalida: '2026-12-10', fechaFin: '2026-12-01' });
    const { req, res, next } = mockReqRes(body);

    validateSurveyPayload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  test('rechaza si presupuesto.monto no es un número positivo', () => {
    const body = buildValidBody({ presupuesto: { monto: -100, moneda: 'USD' } });
    const { req, res, next } = mockReqRes(body);

    validateSurveyPayload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  test('rechaza si viajeros.cantidadTotal supera el máximo (5)', () => {
    const body = buildValidBody({ viajeros: { cantidadTotal: 6, personas: [] } });
    const { req, res, next } = mockReqRes(body);

    validateSurveyPayload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.error.message).toMatch(/máximo/i);
  });

  test('rechaza si lugarSalida no tiene ciudad', () => {
    const body = buildValidBody({ lugarSalida: { pais: 'Argentina' } });
    const { req, res, next } = mockReqRes(body);

    validateSurveyPayload(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});
