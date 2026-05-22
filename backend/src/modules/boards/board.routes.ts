import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import {
  getOrCreateBoard,
  getEvents,
  getSnapshot,
  saveSnapshot,
  getTimelineFrames,
  saveTimelineFrame,
  uploadImage
} from './board.controller';

const router = Router();

// Retrieve or create board for task
router.post('/task/:taskId', protect, getOrCreateBoard);

// Board specific events, snapshots, and frames
router.get('/:boardId/events', protect, getEvents);
router.get('/:boardId/snapshot', protect, getSnapshot);
router.post('/:boardId/snapshot', protect, saveSnapshot);
router.get('/:boardId/timeline-frames', protect, getTimelineFrames);
router.post('/:boardId/timeline-frame', protect, saveTimelineFrame);
router.post('/:boardId/upload-image', protect, uploadImage);

export default router;
