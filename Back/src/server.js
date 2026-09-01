// ============================================================
// server.js — Punto de entrada del Gateway
// Permite conexiones desde otras máquinas de la red local.
// ============================================================

import { app } from './app.js';
import { config } from './config.js';

const HOST = '0.0.0.0';

app.listen(config.port, HOST, () => {
  console.log(`[Gateway] FreeVago API Gateway iniciado`);
  console.log(`[Gateway] Local: http://localhost:${config.port}`);
  console.log(`[Gateway] Red:   http://0.0.0.0:${config.port}`);

  console.log(`[Gateway] Entorno: ${config.nodeEnv}`);
  console.log(`[Gateway] MS1 → ${config.microservices.ms1}`);
  console.log(`[Gateway] MS2 → ${config.microservices.ms2}`);
  console.log(`[Gateway] MS3 → ${config.microservices.ms3}`);
});