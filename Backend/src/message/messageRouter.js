const express = require("express");
const messageRouter = express.Router();
const upload = require("../middlewares/multerConfig");

const {
  getMessages,
  sendMessage,
  sendImageMessage,
  getUnreadCount,
} = require("./messageController");

const { authenticateToken } = require("../middlewares/authHandle");

// Get messages for a specific booking
messageRouter.get("/messages/:bookingId", authenticateToken, getMessages);

messageRouter.post("/message/text", authenticateToken, sendMessage);

messageRouter.post(
  "/message/image",
  authenticateToken,
  upload.single("image"),
  sendImageMessage
);

messageRouter.get("/messages/unread/count", authenticateToken, getUnreadCount);

module.exports = messageRouter;
