const express = require("express");
const notificationRouter = express.Router();

const {
  getAllNotifications,
  getNotificationById,
  markAllNotificationsAsRead,
} = require("./notificationController");
const { authenticateToken } = require("../middlewares/authHandle");

notificationRouter.get(
  "/getAllNotificationByUser",
  authenticateToken,
  getAllNotifications
);

notificationRouter.get(
  "/getNotificationByID/:id",
  authenticateToken,
  getNotificationById
);

notificationRouter.post(
  "/markAllAsRead",
  authenticateToken,
  markAllNotificationsAsRead
);

module.exports = notificationRouter;
