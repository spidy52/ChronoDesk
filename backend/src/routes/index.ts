import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import taskRoutes from '../modules/tasks/task.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

export default router;