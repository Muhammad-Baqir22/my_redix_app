import { Router } from "express";
import { savePost, unsavePost, getSaved, getSavedIds } from "../Controllers/savedpost.controller";
import { tokenVerify } from "../Middleware/auth.middleware";

const router = Router();

router.post("/",    tokenVerify, savePost);
router.delete("/",  tokenVerify, unsavePost);
router.get("/",     tokenVerify, getSaved);
router.get("/ids",  tokenVerify, getSavedIds);

export default router;
