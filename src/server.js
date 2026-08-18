const app = require('./app');
const config = require('./config');

const server = app.listen(config.PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Freevago API Gateway               ║
║  🌍 Ambiente: ${config.NODE_ENV.padEnd(28)} ║
║  🔌 Puerto: ${config.PORT.toString().padEnd(33)} ║
║  🔐 Clerk: Autenticación activa        ║
║  📡 Punto único de entrada             ║
╚════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
