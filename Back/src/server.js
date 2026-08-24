// ============================================================
// server.js — Punto de entrada
// Solo levanta el servidor. La lógica vive en app.js.
// ============================================================
import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`[Gateway] FreeVago API Gateway corriendo en http://localhost:${config.port}`);
  console.log(`[Gateway] Entorno: ${config.nodeEnv}`);
  console.log(`[Gateway] MS1 → ${config.microservices.ms1}`);
  console.log(`[Gateway] MS2 → ${config.microservices.ms2}`);
  console.log(`[Gateway] MS3 → ${config.microservices.ms3}`);
});