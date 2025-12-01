import { Router } from "express";
import { createOrGetConversation, getUserConversations } from "../controllers/conversation.controller.js";
import authorise from "../controllers/auth.controller.js";

const router = Router();

router.post('/create', authorise, createOrGetConversation);
router.get('/list', authorise, getUserConversations);

export default router;