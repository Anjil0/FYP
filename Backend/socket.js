// socket.js - Optimized server-side socket implementation

const socketIo = require("socket.io");
const UserModel = require("./src/users/userModel");
const TutorModel = require("./src/tutors/tutorModel");
const BookingModel = require("./src/booking/bookingModel");
const Notification = require("./src/notification/notificationModel");

/**
 * Sets up and configures the Socket.IO server
 * @param {object} server - HTTP server instance
 * @returns {object} Socket.IO instance and user tracking maps
 */
module.exports = (server) => {
  console.log("Initializing Socket.IO server");

  // Initialize Socket.IO with CORS configuration
  const io = socketIo(server, {
    cors: {
      // origin: "http://192.168.18.3:5173",
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // State tracking maps
  const userSocketMap = new Map();
  const userStatusMap = new Map();
  const roomMap = new Map();

  // Event Handlers
  const handlers = {
    /**
     * Updates all clients with the list of online users
     */
    updateOnlineUsers: () => {
      const onlineUsers = Array.from(userStatusMap.entries())
        .filter(([_, status]) => status)
        .map(([userId]) => userId);

      io.emit("updateOnlineUsers", onlineUsers);
    },

    /**
     * Handles user registration for socket connections
     * @param {object} socket - Socket instance
     * @param {string} userId - User identifier
     */
    handleUserRegister: (socket, userId) => {
      if (!userId) return;
      console.log(`User ${userId} registering with socket ID: ${socket.id}`);

      // Add socket to user's socket collection
      let userSockets = userSocketMap.get(userId) || new Set();
      userSockets.add(socket.id);
      userSocketMap.set(userId, userSockets);

      // Update online status
      const wasOffline = !userStatusMap.get(userId);
      userStatusMap.set(userId, true);

      if (wasOffline) {
        console.log(`User ${userId} status changed to online`);
        io.emit("userStatusChanged", { userId, isOnline: true });
      }

      // Send current status to the client
      socket.emit("initializeStatus", Array.from(userStatusMap.entries()));
      handlers.updateOnlineUsers();

      console.log(
        `User ${userId} registered successfully. Total sockets: ${userSockets.size}`
      );
    },

    /**
     * Handles a user joining a room
     * @param {object} socket - Socket instance
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     */
    handleJoinRoom: (socket, roomId, userId) => {
      if (!roomId || !userId) {
        console.log("Invalid join room request", { roomId, userId });
        return;
      }

      console.log(`User ${userId} attempting to join room ${roomId}`);

      if (roomMap.has(roomId)) {
        const existingUsers = roomMap.get(roomId);

        if (existingUsers.size >= 2 && !existingUsers.has(userId)) {
          console.log(
            `Rejecting ${userId}, room ${roomId} is full with users: ${Array.from(
              existingUsers
            )}`
          );
          socket.emit("room-full", roomId);
          return;
        }

        console.log(
          `Room ${roomId} exists with ${existingUsers.size} users: ${Array.from(
            existingUsers
          )}`
        );
      }

      // Join socket to room
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);

      // Initialize room if needed
      if (!roomMap.has(roomId)) {
        roomMap.set(roomId, new Set());
        console.log(`Created new room: ${roomId}`);
      }

      // Add user to room tracking
      const roomUsers = roomMap.get(roomId);
      roomUsers.add(userId);

      // Notify others in room about new user
      socket.to(roomId).emit("user-connected", userId);

      // Send existing users to the new participant
      const usersInRoom = Array.from(roomUsers).filter((id) => id !== userId);
      socket.emit("room-users", usersInRoom);

      console.log(
        `User ${userId} joined room ${roomId}. Room now has ${roomUsers.size} users`
      );
    },

    /**
     * Handles a user leaving a room
     * @param {object} socket - Socket instance
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     */
    handleLeaveRoom: (socket, roomId, userId) => {
      if (!roomId || !userId) return;

      console.log(`User ${userId} leaving room ${roomId}`);
      socket.leave(roomId);

      // Update room tracking
      const roomUsers = roomMap.get(roomId);
      if (roomUsers) {
        roomUsers.delete(userId);

        // Clean up empty room
        if (roomUsers.size === 0) {
          roomMap.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          console.log(
            `Room ${roomId} now has ${roomUsers.size} users: ${Array.from(
              roomUsers
            )}`
          );
        }
      }

      // Notify others in the room
      socket.to(roomId).emit("user-disconnected", userId);
      console.log(`Notified other users that ${userId} left room ${roomId}`);
    },

    /**
     * Handles WebRTC offer signaling
     * @param {object} socket - Socket instance
     * @param {object} data - Offer data
     */
    handleSendOffer: (socket, { offer, toUserId, fromUserId, roomId }) => {
      const isIceCandidate = offer && offer.candidate;
      console.log(
        `Received ${
          isIceCandidate ? "ICE candidate" : "offer"
        } from ${fromUserId} to ${toUserId}`
      );

      const toUserSockets = userSocketMap.get(toUserId);
      if (!toUserSockets || toUserSockets.size === 0) {
        console.log(`Cannot forward - user ${toUserId} has no active sockets`);
        return;
      }

      // Send only to first socket to avoid duplicates
      const recipientSocketId = Array.from(toUserSockets)[0];
      io.to(recipientSocketId).emit("receive-offer", {
        offer,
        fromUserId,
        roomId,
      });
      console.log(`Forwarded to ${toUserId}'s socket ${recipientSocketId}`);
    },

    /**
     * Handles WebRTC answer signaling
     * @param {object} socket - Socket instance
     * @param {object} data - Answer data
     */
    handleSendAnswer: (socket, { answer, toUserId, fromUserId }) => {
      console.log(`Received answer from ${fromUserId} to ${toUserId}`);
      const toUserSockets = userSocketMap.get(toUserId);

      if (!toUserSockets || toUserSockets.size === 0) {
        console.log(
          `Cannot forward answer - user ${toUserId} has no active sockets`
        );
        return;
      }

      // Forward to all recipient's sockets
      const recipientSocketId = Array.from(toUserSockets)[0]; // Send to first socket only
      io.to(recipientSocketId).emit("receive-answer", { answer, fromUserId });
      console.log(`Forwarded answer to ${toUserId}'s socket`);
    },

    /**
     * Handles ICE candidate signaling
     * @param {object} socket - Socket instance
     * @param {object} data - ICE candidate data
     */
    handleIceCandidate: (socket, { candidate, toUserId, fromUserId }) => {
      console.log(`Received ICE candidate from ${fromUserId} to ${toUserId}`);
      const toUserSockets = userSocketMap.get(toUserId);

      if (!toUserSockets || toUserSockets.size === 0) {
        console.log(
          `Cannot forward ICE candidate - user ${toUserId} has no active sockets`
        );
        return;
      }

      // Send to first socket only to avoid duplicates
      const recipientSocketId = Array.from(toUserSockets)[0];
      io.to(recipientSocketId).emit("receive-ice-candidate", {
        candidate,
        fromUserId,
      });
    },

    /**
     * Handles socket disconnection
     * @param {object} socket - Socket instance
     * @param {string} userId - User identifier
     */
    handleDisconnect: (socket, userId) => {
      if (!userId) return;
      console.log(
        `Socket disconnected: ${socket.id}, linked to user: ${userId}`
      );

      // Remove socket from user's socket collection
      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          // User has no more active connections
          console.log(
            `User ${userId} has no more active sockets, marking offline`
          );
          userSocketMap.delete(userId);
          userStatusMap.set(userId, false);
          io.emit("userStatusChanged", { userId, isOnline: false });
          handlers.updateOnlineUsers();
        } else {
          console.log(
            `User ${userId} still has ${userSockets.size} active sockets`
          );
        }
      }

      // Handle room cleanup
      roomMap.forEach((users, roomId) => {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(roomId).emit("user-disconnected", userId);

          if (users.size === 0) {
            roomMap.delete(roomId);
            console.log(`Room ${roomId} deleted (empty after disconnect)`);
          } else {
            console.log(`Room ${roomId} now has ${users.size} users remaining`);
          }
        }
      });
    },
  };

  // Set up socket connection handler
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    let currentUserId = null;

    // Register event handlers
    socket.on("register", (userId) => {
      currentUserId = userId;
      handlers.handleUserRegister(socket, userId);
    });

    socket.on("join-room", (roomId, userId) => {
      currentUserId = userId;
      handlers.handleJoinRoom(socket, roomId, userId);
    });

    socket.on("leave-room", (roomId, userId) => {
      handlers.handleLeaveRoom(socket, roomId, userId);
    });

    socket.on("send-offer", (data) => handlers.handleSendOffer(socket, data));
    socket.on("send-answer", (data) => handlers.handleSendAnswer(socket, data));
    socket.on("send-ice-candidate", (data) =>
      handlers.handleIceCandidate(socket, data)
    );

    // Simple chat events
    socket.on("typing", ({ bookingId }) => {
      socket.broadcast.emit("typing", { bookingId });
    });

    socket.on("stopTyping", ({ bookingId }) => {
      socket.broadcast.emit("stopTyping", { bookingId });
    });

    // Handle sending announcement
    socket.on("send_announcement", async (data) => {
      const { title, content, targetAudience } = data;

      let userIdsToNotify = [];

      try {
        if (targetAudience === "all") {
          // Notify all online users
          userIdsToNotify = Array.from(userSocketMap.keys());
        } else if (targetAudience === "students") {
          for (let userId of userSocketMap.keys()) {
            const user = await UserModel.findById(userId);
            if (user && user.role === "user") {
              userIdsToNotify.push(userId);
            }
          }
        } else if (targetAudience === "tutors") {
          // Get only the online tutors
          for (let userId of userSocketMap.keys()) {
            const tutor = await TutorModel.findById(userId);
            if (tutor && tutor.role === "tutor") {
              userIdsToNotify.push(userId);
            }
          }
        }

        console.log(userIdsToNotify);
        // Send the announcement to all relevant users
        userIdsToNotify.forEach((userId) => {
          console.log(`Sending announcement to user ${userId}`);

          const socketIds = userSocketMap.get(userId);

          if (socketIds && socketIds.size > 0) {
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("receive_announcements", { title, content });
            });
          }
        });
        await sendNotification(targetAudience, content);
      } catch (err) {
        console.error("Error processing announcement:", err);
      }
    });

    // Handle sending tutor announcement
    socket.on("send_tutor_announcement", async (data) => {
      const { title, content, selectedStudents } = data;
      let userIdsToNotify = [];

      try {
        // Validate and process the selected students
        userIdsToNotify = Array.from(new Set(selectedStudents));

        // Send the announcement to selected students
        userIdsToNotify.forEach((userId) => {
          const socketIds = userSocketMap.get(userId);

          if (socketIds && socketIds.size > 0) {
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("receive_announcements", { title, content });
            });
          }
        });

        // Send notifications to the selected students
        await sendTutorNotification(userIdsToNotify, content);
      } catch (err) {
        console.error("Error processing tutor announcement:", err);
      }
    });

    // Disconnection handler
    socket.on("disconnect", () => {
      handlers.handleDisconnect(socket, currentUserId);
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`Socket error on ${socket.id}: ${error}`);
    });
  });

  // Status logging (reduced frequency to every 5 minutes)
  setInterval(() => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] Status: ${roomMap.size} active rooms, ${
        Array.from(userStatusMap.entries()).filter(([_, status]) => status)
          .length
      } online users`
    );
  }, 60000);

  return { io, userSocketMap, userStatusMap };
};

const sendTutorNotification = async (studentIds, message) => {
  try {
    // Fetch student details based on studentIds
    const students = await UserModel.find({ _id: { $in: studentIds } });

    // Prepare notification data
    const notifications = students.map((student) => ({
      recipient: student._id,
      recipientModel: "User",
      type: "other",
      message: " (Tutor) " + message,
    }));

    // Store notifications in the database
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error sending tutor notification:", error);
  }
};

const sendNotification = async (target, message) => {
  try {
    let recipients = [];

    if (target === "all") {
      // Get all users
      const users = await UserModel.find({}, "_id role");
      // Get verified tutors
      const tutors = await TutorModel.find(
        { isVerified: "verified" },
        "_id role"
      );
      recipients = [...users, ...tutors];
    } else if (target === "tutors") {
      // Get only verified tutors
      recipients = await TutorModel.find(
        { isVerified: "verified" },
        "_id role"
      );
    } else if (target === "students") {
      // Get only users
      recipients = await UserModel.find({}, "_id role");
    }

    if (!recipients.length) {
      console.log(`No recipients found for target: ${target}`);
      return;
    }

    const notifications = recipients.map((recipient) => ({
      recipient: recipient._id,
      recipientModel: recipient.role === "tutor" ? "Tutor" : "User",
      type: "other",
      message: "Announcement from Admin: " + message,
    }));

    await Notification.insertMany(notifications);
    console.log(
      `Notifications sent successfully to ${recipients.length} recipients.`
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};
