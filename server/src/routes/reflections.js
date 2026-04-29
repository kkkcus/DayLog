import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getReflectionByDate,
  createReflection,
  updateReflection
} from '../controllers/reflectionController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getReflectionByDate);
router.post('/', createReflection);
router.patch('/:id', updateReflection);

export default router;
