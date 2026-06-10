import { Router } from 'express';

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addCollaborator,
  removeCollaborator,
  acceptTaskInvitation,
  rejectTaskInvitation,
} from './task.controller';

import {
  protect,
} from '../../middleware/auth.middleware';

const router = Router();

/* PROTECTED */

router.use(protect);

/* ROUTES */

router.post('/', createTask);

router.get('/', getTasks);

router.patch('/:id', updateTask);

router.delete('/:id', deleteTask);

router.post('/invitations/:id/accept', acceptTaskInvitation);
router.post('/invitations/:id/reject', rejectTaskInvitation);

router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

export default router;