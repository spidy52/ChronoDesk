import { Router } from 'express';

import {
  createEvent,
  getEvents,
  deleteEvent,
} from './event.controller';

import {
  protect,
} from '../../middleware/auth.middleware';

const router = Router();

router.post(
  '/',
  protect,
  createEvent
);

router.get(
  '/',
  protect,
  getEvents
);

router.delete(
  '/:id',
  protect,
  deleteEvent
);

export default router;