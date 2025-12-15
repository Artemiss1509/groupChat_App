import { Router } from "express";
import { getPredictions, getSmartReplies } from "../controllers/ai.controller.js";
import authorise from "../controllers/auth.controller.js";

const router = Router();

router.post('/predictions', authorise, getPredictions);
router.post('/smart-replies', authorise, getSmartReplies);

export default router;