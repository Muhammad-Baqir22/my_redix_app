import express from "express";
import prisma from "../db/prismaclient";

const router = express.Router();
router.get("/history/private/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  res.json(messages);
});

router.get("/history/subreddit/:subredditId", async (req, res) => {
  const { subredditId } = req.params;
  const messages = await prisma.message.findMany({
    where: { subredditId },
    orderBy: { createdAt: "asc" }
  });
  res.json(messages);
});

export default router;
