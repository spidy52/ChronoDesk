import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import {
  getChats,
  getMessages,
  createChatWithUser,
  deleteChat,
  searchUsers,
} from './chat.controller';

const router = Router();

router.use(protect);

router.get('/chats', getChats);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chat/user', createChatWithUser);
router.delete('/chats/:chatId', deleteChat);
router.post('/users/search', searchUsers);

export default router;
