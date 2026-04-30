import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getFortune } from '../controllers/fortuneController.js';

const router = express.Router();
router.use(authenticate);
router.get('/', getFortune);

export default router;
