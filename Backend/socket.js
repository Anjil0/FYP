// Server-side socket.js with room limit enforcement and debugging

const socketIo = require("socket.io");

module.exports = (server) => {
  console.log("Initializing Socket.IO server");

  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Allow connections from any origin during development
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Maps to track user connections and online status
  const userSocketMap = new Map(); // Maps userId to a Set of socket IDs
  const userStatusMap = new Map(); // Maps userId to online status (true/false)
  const roomMap = new Map(); // Maps roomId to set of users in that room

  // Function to update all clients with the list of online users
  const updateOnlineUsers = () => {
    const onlineUsers = Array.from(userStatusMap.entries()).filter(
      ([_, status]) => status
    );
    io.emit(
      "updateOnlineUsers",
      onlineUsers.map(([userId]) => userId)
    );
  };

  // Handle new socket connections
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    let currentUserId = null;

    socket.on("register", (userId) => {
      if (!userId) return;
      console.log(`User ${userId} registering with socket ID: ${socket.id}`);

      currentUserId = userId;

      let userSockets = userSocketMap.get(userId) || new Set();
      userSockets.add(socket.id);
      userSocketMap.set(userId, userSockets);

      const wasOffline = !userStatusMap.get(userId);
      userStatusMap.set(userId, true);
      if (wasOffline) {
        console.log(`User ${userId} status changed to online`);
        io.emit("userStatusChanged", { userId, isOnline: true });
      }

      socket.emit("initializeStatus", Array.from(userStatusMap.entries()));
      updateOnlineUsers();

      console.log(
        `User ${userId} registered successfully. Total sockets for user: ${userSockets.size}`
      );
    });

    // Event: Join a room for video calling
    socket.on("join-room", (roomId, userId) => {
      if (!roomId || !userId) {
        console.log("Invalid join room request", { roomId, userId });
        return;
      }

      console.log(
        `User ${userId} attempting to join room ${roomId} with socket ${socket.id}`
      );
      currentUserId = userId; // Set the current user ID

      // Check if the room exists and already has 2 participants
      if (roomMap.has(roomId)) {
        const existingUsers = roomMap.get(roomId);

        // If room already has 2 participants, reject the join request
        // Allow the same user to rejoin (e.g. after refresh/reconnect)
        if (existingUsers.size >= 2 && !existingUsers.has(userId)) {
          console.log(
            `Rejecting ${userId}, room ${roomId} is full with ${
              existingUsers.size
            } users: ${Array.from(existingUsers)}`
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

      // Add user to room
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);

      // Track users in room
      if (!roomMap.has(roomId)) {
        roomMap.set(roomId, new Set());
        console.log(`Created new room: ${roomId}`);
      }

      const roomUsers = roomMap.get(roomId);
      roomUsers.add(userId);

      // Notify others in the room about new user
      socket.to(roomId).emit("user-connected", userId);

      // Send list of users already in the room to the joining user
      // Exclude the current user from the list
      const usersInRoom = Array.from(roomUsers).filter((id) => id !== userId);
      socket.emit("room-users", usersInRoom);

      console.log(`User ${userId} joined room ${roomId}`);
      console.log(
        `Room ${roomId} now has ${roomUsers.size} users: ${Array.from(
          roomUsers
        )}`
      );
    });

    // Event: Leave a room
    socket.on("leave-room", (roomId, userId) => {
      if (roomId && userId) {
        console.log(`User ${userId} leaving room ${roomId}`);

        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);

        // Remove user from room tracking
        const roomUsers = roomMap.get(roomId);
        if (roomUsers) {
          roomUsers.delete(userId);

          // If room is empty, delete it
          if (roomUsers.size === 0) {
            roomMap.delete(roomId);
            console.log(`Room ${roomId} has been deleted (empty)`);
          } else {
            console.log(
              `Room ${roomId} now has ${roomUsers.size} users: ${Array.from(
                roomUsers
              )}`
            );
          }
        }

        // Notify others that user has left
        socket.to(roomId).emit("user-disconnected", userId);
        console.log(`Notified other users that ${userId} left room ${roomId}`);
      }
    });

    // On your server - update the send-offer handler
    socket.on("send-offer", ({ offer, toUserId, fromUserId, roomId }) => {
      console.log(
        `Received offer from ${fromUserId} to ${toUserId} in room ${roomId}`
      );

      // Check if the offer contains a candidate field (ice candidate)
      const isIceCandidate = offer && offer.candidate;

      // For offers (not ice candidates), track the sent offers to avoid duplicates
      if (!isIceCandidate) {
        // You can use a Map or object to track which offers have been sent
        // For simplicity, we'll just log it here
        console.log(`Sending SDP offer from ${fromUserId} to ${toUserId}`);
      }

      const toUserSockets = userSocketMap.get(toUserId);

      if (toUserSockets) {
        console.log(
          `Forwarding ${
            isIceCandidate ? "ICE candidate" : "offer"
          } to ${toUserId}'s ${toUserSockets.size} sockets`
        );

        // Only send to the first socket of the recipient to avoid duplicates
        const recipientSocketId = Array.from(toUserSockets)[0];
        io.to(recipientSocketId).emit("receive-offer", {
          offer,
          fromUserId,
          roomId,
        });
      } else {
        console.log(
          `Cannot forward offer - user ${toUserId} has no active sockets`
        );
      }
    });

    socket.on("send-answer", ({ answer, toUserId, fromUserId }) => {
      console.log(`Received answer from ${fromUserId} to ${toUserId}`);
      const toUserSockets = userSocketMap.get(toUserId);

      if (toUserSockets) {
        console.log(
          `Forwarding answer to ${toUserId}'s ${toUserSockets.size} sockets`
        );
        toUserSockets.forEach((socketId) => {
          io.to(socketId).emit("receive-answer", {
            answer,
            fromUserId,
          });
        });
      } else {
        console.log(
          `Cannot forward answer - user ${toUserId} has no active sockets`
        );
      }
    });

    socket.on("send-ice-candidate", ({ candidate, toUserId, fromUserId }) => {
      console.log(`Received ICE candidate from ${fromUserId} to ${toUserId}`);
      const toUserSockets = userSocketMap.get(toUserId);

      if (toUserSockets) {
        toUserSockets.forEach((socketId) => {
          io.to(socketId).emit("receive-ice-candidate", {
            candidate,
            fromUserId,
          });
        });
      } else {
        console.log(
          `Cannot forward ICE candidate - user ${toUserId} has no active sockets`
        );
      }
    });

    socket.on("typing", ({ bookingId }) => {
      socket.broadcast.emit("typing", { bookingId });
    });

    socket.on("stopTyping", ({ bookingId }) => {
      socket.broadcast.emit("stopTyping", { bookingId });
    });

    // Handle socket disconnection
    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}, was linked to user: ${currentUserId}`
      );

      if (!currentUserId) return;

      const userSockets = userSocketMap.get(currentUserId);
      if (userSockets) {
        userSockets.delete(socket.id);
        console.log(`Removed socket ${socket.id} from user ${currentUserId}`);

        if (userSockets.size === 0) {
          console.log(
            `User ${currentUserId} has no more active sockets, marking as offline`
          );
          userSocketMap.delete(currentUserId);
          userStatusMap.set(currentUserId, false);
          io.emit("userStatusChanged", {
            userId: currentUserId,
            isOnline: false,
          });
          updateOnlineUsers();
        } else {
          console.log(
            `User ${currentUserId} still has ${userSockets.size} active sockets`
          );
        }
      }

      // Handle room cleanup when user disconnects
      roomMap.forEach((users, roomId) => {
        if (users.has(currentUserId)) {
          users.delete(currentUserId);

          // Notify others in the room that user has disconnected
          socket.to(roomId).emit("user-disconnected", currentUserId);
          console.log(
            `User ${currentUserId} removed from room ${roomId} due to disconnect`
          );

          // If room is empty, delete it
          if (users.size === 0) {
            roomMap.delete(roomId);
            console.log(
              `Room ${roomId} has been deleted (empty after disconnect)`
            );
          } else {
            console.log(
              `Room ${roomId} now has ${
                users.size
              } users remaining: ${Array.from(users)}`
            );
          }
        }
      });
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error(`Socket error on ${socket.id}: ${error}`);
    });
  });

  // Periodically log active rooms and users for monitoring
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Active rooms: ${roomMap.size}`);
    roomMap.forEach((users, roomId) => {
      console.log(`Room ${roomId}: ${users.size} users - ${Array.from(users)}`);
    });

    console.log(
      `Online users: ${Array.from(userStatusMap.entries())
        .filter(([_, status]) => status)
        .map(([userId]) => userId)
        .join(", ")}`
    );
  }, 60000); // Log every minute

  return { io, userSocketMap, userStatusMap };
};
