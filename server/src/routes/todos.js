import express from 'express';
import {
  getTodos,
  createTodo,
  toggleTodo,
  deleteTodo,
  getFrequentTodos
} from '../controllers/todoController.js';

const router = express.Router();

router.get('/frequent', getFrequentTodos);
router.get('/', getTodos);
router.post('/', createTodo);
router.patch('/:id', toggleTodo);
router.delete('/:id', deleteTodo);

export default router;
