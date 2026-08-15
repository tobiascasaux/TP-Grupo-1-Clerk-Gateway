import axios from 'axios';
import { config } from '../config.js';

// Cliente centralizado para llamar a los microservicios internos.
// timeoutMs se puede sobreescribir por ruta si algún servicio (ej. la IA) necesita más tiempo.
export function createServiceClient(baseURL, timeoutMs = config.defaultTimeoutMs) {
  return axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });
}
