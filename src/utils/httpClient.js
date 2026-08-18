// ============================================================
// httpClient.js — Cliente HTTP para llamar a microservicios
// Usa axios con timeout configurable por servicio.
// Cada ruta pasa su propio timeout según cuánto puede tardar:
//   MS1 (encuesta/IA): 10s
//   MS2 (scraping):    30s — scrapea sitios externos
//   MS3 (armado):      45s — espera MS2 + llama a Gemini
// ============================================================
import axios from 'axios';
import { config } from '../config.js';

export function createServiceClient(baseURL, timeoutMs = config.timeouts.ms1) {
  return axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}