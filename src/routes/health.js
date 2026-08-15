import { Router } from 'express';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/', (req, res) => {
  return successResponse(res, { status: 'ok', service: 'gateway' });
});

export default router;
