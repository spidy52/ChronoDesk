import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import taskRoutes from '../modules/tasks/task.routes';
import workspaceRoutes from '../modules/workspace/workspace.routes';
import eventRoutes from '../modules/events/event.routes';
import membersRoutes from '../modules/members/member.routes';
import chatRoutes from '../modules/chat/chat.routes';
import boardRoutes from '../modules/boards/board.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/events', eventRoutes);
router.use('/members', membersRoutes);
router.use('/boards', boardRoutes);
router.use('/', chatRoutes);
export default router;