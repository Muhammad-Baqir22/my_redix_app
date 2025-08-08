import { Router } from "express";
import { genrateSignedUrlController } from "../Controllers/upload.controller";


const router = Router();

router.post('/genrateUrl',genrateSignedUrlController);

export default router;