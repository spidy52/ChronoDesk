import { Router } from 'express';

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from './task.controller';

const router = Router();

router.post('/', createTask);

router.get('/', getTasks);

router.patch('/:id', updateTask);

router.delete('/:id', deleteTask);

export default router;