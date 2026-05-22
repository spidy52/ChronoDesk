import { Router } from 'express';

import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from './workspace.controller';

import {
  protect,
} from '../../middleware/auth.middleware';

const router = Router();

/* PROTECT ALL ROUTES */

router.use(protect);

/* ROUTES */

router.post('/', createWorkspace);

router.get('/', getWorkspaces);

router.get('/:id', getWorkspaceById);

router.patch('/:id', updateWorkspace);

router.delete('/:id', deleteWorkspace);

export default router;
