import { Router } from "express";
import { uploadMedia, getMediaUrl } from "../controllers/media.controller.js";
import authorise from "../controllers/auth.controller.js";
import { upload } from "../utils/multer.config.js";

const router = Router();

router.post('/upload', authorise, upload.single('media'), uploadMedia);
router.get('/url', authorise, getMediaUrl);

export default router;