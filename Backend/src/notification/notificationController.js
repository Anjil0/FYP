const createError = require("http-errors");
const Notification = require("./notificationModel");
const userModel = require("../users/userModel");
const tutorModel = require("../tutors/tutorModel");

const getAllNotifications = async (req, res, next) => {
  const userId = req.user.sub;
  try {
    let account = await userModel.findById(userId);

    if (!account) {
      account = await tutorModel.findById(userId);
    }

    const notifications = await Notification.find({
      recipient: userId,
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      StatusCode: 200,
      ErrorMessage: [],
      Result: {
        message: "Successfully fetched all notifications",
        data: notifications,
        unreadCount: unreadCount,
      },
    });
  } catch (error) {
    console.error(error);
    next(
      createError(
        500,
        `Server Error while fetching notifications. ${error.message}`
      )
    );
  }
};

// Get a single notification by ID
const getNotificationById = async (req, res, next) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findById(notificationId).select(
      "typeId message isRead createdAt"
    );
    if (!notification) {
      return next(createError(404, "Notification not found"));
    }

    res.status(200).json({
      StatusCode: 200,
      ErrorMessage: [],
      Result: {
        message: "Successfully fetched notification",
        data: notification,
      },
    });
  } catch (error) {
    next(
      createError(
        500,
        `Server Error while fetching notification by ID. ${error.message}`
      )
    );
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  const userId = req.user.sub;
  let account = await userModel.findById(userId);

  if (!account) {
    account = await tutorModel.findById(userId);
  }
  try {
    const result = await Notification.updateMany(
      { recipient: userId },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      StatusCode: 200,
      ErrorMessage: [],
      Result: {
        message: "All notifications marked as read successfully",
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error(error);
    next(
      createError(
        500,
        `Server Error while marking all notifications as read. ${error.message}`
      )
    );
  }
};

module.exports = {
  getAllNotifications,
  markAllNotificationsAsRead,
  getNotificationById,
};
