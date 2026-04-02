import express from 'express';
import {
  getReflectionByDate,
  createReflection,
  updateReflection
} from '../controllers/reflectionController.js';

const router = express.Router();

router.get('/', getReflectionByDate);
router.post('/', createReflection);
router.patch('/:id', updateReflection);

export default router;
