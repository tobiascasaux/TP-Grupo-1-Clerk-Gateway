// src/lib/useApi.js
import { useAuth } from '@clerk/react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function useApi() {
  const { getToken } = useAuth();

  async function apiFetch(path, options = {}) {
    const token = await getToken();

    const respuesta = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      // El contrato del equipo define el error como:
      // { error: { code, message, service, requestId } }
      const info = cuerpo.error || {};
      const err = new Error(info.message || `Error ${respuesta.status}`);
      err.code = info.code;
      err.service = info.service;
      err.requestId = info.requestId;
      throw err;
    }

    // Las respuestas exitosas vienen sin wrapper, directo el data
    return cuerpo;
  }

  return { apiFetch };
}