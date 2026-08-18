const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');

// GET /api/health
// Verificar que el gateway está corriendo
router.get('/health', (req, res) => {
  sendSuccess(res, 200, { status: 'ok', message: 'Gateway is running' }, req.id);
});

module.exports = router;
