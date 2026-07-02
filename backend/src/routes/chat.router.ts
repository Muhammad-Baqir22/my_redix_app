import express from "express";
import prisma from "../db/prismaclient";
import { tokenVerify } from "../Middleware/auth.middleware";
import mqttClient from "../mqtt/mqttClient";

const router = express.Router();

/* ── Get all conversations for current user ── */
router.get("/conversations", tokenVerify, async (req, res): Promise<any> => {
  const userId = (req as any).user_id;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        subredditId: null,
        receiverId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender:   { select: { id: true, username: true, avatar_url: true } },
        receiver: { select: { id: true, username: true, avatar_url: true } },
      },
    });

    const convMap = new Map<string, any>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId! : msg.senderId;
      if (partnerId && !convMap.has(partnerId)) {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        convMap.set(partnerId, { partner, lastMessage: msg });
      }
    }

    return res.json({ success: true, data: Array.from(convMap.values()) });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Get message history with a specific partner ── */
router.get("/history/dm/:partnerId", tokenVerify, async (req, res): Promise<any> => {
  const userId = (req as any).user_id;
  const { partnerId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId,    receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, username: true, avatar_url: true } },
      },
    });
    return res.json({ success: true, data: messages });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Send a message ── */
router.post("/send", tokenVerify, async (req, res): Promise<any> => {
  const senderId = (req as any).user_id;
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim())
    return res.status(400).json({ success: false, message: "receiver_id and content required" });
  try {
    const [message, sender] = await Promise.all([
      prisma.message.create({
        data: { senderId, receiverId: receiver_id, content: content.trim() },
        include: { sender: { select: { id: true, username: true, avatar_url: true } } },
      }),
      prisma.user.findUnique({ where: { id: senderId }, select: { username: true } }),
    ]);

    // Notify the receiver
    await prisma.notification.create({
      data: {
        user_id: receiver_id,
        type: "message",
        Read: false,
        message: `u/${sender?.username ?? "Someone"} sent you a message`,
      },
    });

    // Always respond with success — MQTT failure must not break the HTTP response
    const response = res.json({ success: true, data: message });

    // Publish real-time notification after responding so broker errors are isolated
    try {
      mqttClient.publish(
        `msg/${receiver_id}/${senderId}`,
        JSON.stringify({
          id: message.id,
          senderId,
          receiverId: receiver_id,
          content: message.content,
          createdAt: message.createdAt instanceof Date
            ? message.createdAt.toISOString()
            : message.createdAt,
          sender: message.sender,
        }),
        { qos: 1 }
      );
    } catch (mqttErr) {
      console.error("MQTT publish failed (message already saved):", mqttErr);
    }

    return response;
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Delete entire conversation ── */
router.delete("/conversation/:partnerId", tokenVerify, async (req, res): Promise<any> => {
  const userId = (req as any).user_id;
  const { partnerId } = req.params;
  try {
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
    });
    return res.json({ success: true, message: "Conversation deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Delete a message ── */
router.delete("/message/:id", tokenVerify, async (req, res): Promise<any> => {
  const userId = (req as any).user_id;
  const { id } = req.params;
  try {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (message.senderId !== userId) return res.status(403).json({ success: false, message: "Not authorized" });
    await prisma.message.delete({ where: { id } });
    return res.json({ success: true, message: "Message deleted" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Legacy endpoints (kept for compatibility) ── */
router.get("/history/private/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

router.get("/history/subreddit/:subredditId", async (req, res) => {
  const { subredditId } = req.params;
  const messages = await prisma.message.findMany({
    where: { subredditId },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

export default router;
