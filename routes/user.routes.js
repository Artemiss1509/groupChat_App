import { Router } from "express";
import { signUp, signIn, searchUsers} from "../controllers/user.controller.js";
import authorise from "../controllers/auth.controller.js";

const router = Router();

router.post('/sign-up',signUp)
router.post('/sign-in',signIn)
router.get('/search',authorise, searchUsers);

export default router;