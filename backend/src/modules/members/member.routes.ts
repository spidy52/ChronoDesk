import express from 'express';

import {
  sendInvitation,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  getMembers,
  removeMember,
} from './member.controller';

import { protect }
from '../../middleware/auth.middleware';

const router =
  express.Router();

/* ================= INVITATIONS ================= */

router.post(
  '/invite',
  protect,
  sendInvitation
);

router.get(
  '/invitations',
  protect,
  getInvitations
);

router.patch(
  '/accept/:id',
  protect,
  acceptInvitation
);

router.patch(
  '/reject/:id',
  protect,
  rejectInvitation
);

/* ================= MEMBERS ================= */

router.get(
  '/',
  protect,
  getMembers
);

router.delete(
  '/:id',
  protect,
  removeMember
);

export default router;