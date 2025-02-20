const Message = require("./messageModel");
const Booking = require("../booking/bookingModel");
const createError = require("http-errors");
const { uploadToCloudinary, getFilePath } = require("../utils/fileUpload");

// Get Messages
const getMessages = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub;

    const booking = await Booking.findById(bookingId);
    if (
      !booking ||
      (booking.studentId.toString() !== userId &&
        booking.tutorId.toString() !== userId)
    ) {
      return next(createError(400, "Booking not found or unauthorized"));
    }

    const messages = await Message.find({
      bookingId,
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read
    await Message.updateMany(
      { bookingId, receiverId: userId, read: false },
      { read: true }
    );

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: { messages, booking },
    });
  } catch (error) {
    next(createError(500, `Failed to get messages, Please try again Later`));
  }
};

// Send Text Message
const sendMessage = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.sub;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(createError(400, "Booking not found"));
    }

    const isSenderStudent = booking.studentId.toString() === userId;
    const isSenderTutor = booking.tutorId.toString() === userId;

    if (!isSenderStudent && !isSenderTutor) {
      return next(createError(400, "Unauthorized to send messages"));
    }

    const senderId = userId;
    const receiverId = isSenderStudent ? booking.tutorId : booking.studentId;

    const message = new Message({
      senderId,
      receiverId,
      bookingId,
      content: req.body.content,
      lastMessageAt: new Date(),
    });

    await message.save();
    const populatedMessage = await Message.findById(message._id).lean();

    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    const receiverIDString = receiverId.toString();
    if (userSocketMap.has(receiverIDString)) {
      const receiverSocketIDs = userSocketMap.get(receiverIDString);
      receiverSocketIDs.forEach((socketId) => {
        io.to(socketId).emit("newMessage", populatedMessage);
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: { message: populatedMessage },
    });
  } catch (error) {
    next(createError(500, `Failed to send message, Please try again Later`));
  }
};

// Send Image Message
const sendImageMessage = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.sub;

    if (!req.file) {
      return next(createError(400, "No image file provided"));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(createError(400, "Booking not found"));
    }

    const isSenderStudent = booking.studentId.toString() === userId;
    const isSenderTutor = booking.tutorId.toString() === userId;

    if (!isSenderStudent && !isSenderTutor) {
      return next(createError(400, "Unauthorized to send messages"));
    }

    const senderId = userId;
    const receiverId = isSenderStudent ? booking.tutorId : booking.studentId;

    let imageUrl = "";
    if (req.file) {
      const imagePath = getFilePath(req.file.filename);
      const imageMimeType = req.file.mimetype.split("/").pop();
      imageUrl = await uploadToCloudinary(
        imagePath,
        "TutorEase/MessageImages",
        req.file.filename,
        imageMimeType
      );
    }

    // Save message
    const message = new Message({
      senderId,
      receiverId,
      bookingId,
      imageUrl,
      lastMessageAt: new Date(),
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id).lean();
    // Emit the message using Socket.IO
    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");
    const receiverIDString = receiverId.toString();
    if (userSocketMap.has(receiverIDString)) {
      const receiverSocketIDs = userSocketMap.get(receiverIDString);
      receiverSocketIDs.forEach((socketId) => {
        io.to(socketId).emit("newMessage", populatedMessage);
      });
    }

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: { message: populatedMessage },
    });
  } catch (error) {
    next(createError(500, `Failed to send image, Please try again Later`));
  }
};

// Get Unread Messages Count
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.sub;

    const count = await Message.countDocuments({
      receiverId: userId,
      read: false,
    });

    res.status(200).json({
      StatusCode: 200,
      IsSuccess: true,
      ErrorMessage: [],
      Result: { unreadCount: count },
    });
  } catch (error) {
    next(
      createError(500, `Failed to get unread count, Please try again Later`)
    );
  }
};

module.exports = {
  getMessages,
  sendMessage,
  sendImageMessage,
  getUnreadCount,
};
