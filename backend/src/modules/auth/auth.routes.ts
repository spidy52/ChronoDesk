import { Router } from 'express';

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  searchUsers,
  getProfile,
} from './auth.controller';

import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.post('/change-password', protect, changePassword as any);

router.put('/profile', protect, updateProfile as any);
router.get('/profile', protect, getProfile as any);

router.get('/search-users', protect, searchUsers as any);

export default router;