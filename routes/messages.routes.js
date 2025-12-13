import { Router } from "express";
import { sendMessage, getConversationMessages, markMessagesAsRead } from "../controllers/messages.controller.js";
import authorise from "../controllers/auth.controller.js";

const router = Router();

router.post('/send', authorise, sendMessage);
router.get('/:conversationId', authorise, getConversationMessages);
router.post('/mark-read', authorise, markMessagesAsRead);

export default router;