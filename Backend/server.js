const app = require("./src/app");
const connectDB = require("./src/config/dbConnect");
const http = require("http");
const socketIo = require("socket.io");
const config = require("./src/config/config");

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    // Initialize Socket.IO with configuration
    const io = socketIo(server, {
      cors: {
        origin: "http://localhost:5173",
        allowedHeaders: ["Content-Type"],
        credentials: true,
      },
      pingTimeout: 60000, // 1 minute
      pingInterval: 25000, // 25 seconds
    });

    // Store user connections and their status
    const userSocketMap = new Map();
    const userStatusMap = new Map();

    const updateOnlineUsers = () => {
      const onlineUsers = Array.from(userStatusMap.entries()).filter(
        ([_, status]) => status
      );
      io.emit(
        "updateOnlineUsers",
        onlineUsers.map(([userId]) => userId)
      );
    };

    io.on("connection", (socket) => {
      console.log(`New connection established: ${socket.id}`);
      let currentUserId = null;

      socket.on("register", (userId) => {
        if (!userId) return;

        currentUserId = userId;

        // Update socket mapping
        let userSockets = userSocketMap.get(userId) || new Set();
        userSockets.add(socket.id);
        userSocketMap.set(userId, userSockets);

        // Update user status
        const wasOffline = !userStatusMap.get(userId);
        userStatusMap.set(userId, true);

        // If user wasn't online before, notify others
        if (wasOffline) {
          io.emit("userStatusChanged", { userId, isOnline: true });
        }

        // Send current status to the newly connected client
        socket.emit("initializeStatus", Array.from(userStatusMap.entries()));

        // Update online users list for everyone
        updateOnlineUsers();

        console.log(`User ${userId} registered with socket ${socket.id}`);
        console.log(
          "Current online users:",
          Array.from(userStatusMap.entries())
        );
      });

      socket.on("disconnect", (reason) => {
        if (!currentUserId) return;

        const userSockets = userSocketMap.get(currentUserId);
        if (userSockets) {
          // Remove this socket
          userSockets.delete(socket.id);

          // If user has no more active sockets
          if (userSockets.size === 0) {
            userSocketMap.delete(currentUserId);
            userStatusMap.set(currentUserId, false);

            // Notify others about status change
            io.emit("userStatusChanged", {
              userId: currentUserId,
              isOnline: false,
            });

            // Update online users list
            updateOnlineUsers();
          }
        }

        console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
        console.log(
          "Current online users:",
          Array.from(userStatusMap.entries())
        );
      });

      socket.on("typing", ({ bookingId }) => {
        socket.broadcast.emit("typing", { bookingId });
      });

      socket.on("stopTyping", ({ bookingId }) => {
        socket.broadcast.emit("stopTyping", { bookingId });
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });
    });

    // Clean up interval - check for stale connections
    setInterval(() => {
      userSocketMap.forEach((sockets, userId) => {
        // Check if all sockets are actually connected
        const activeSockets = Array.from(sockets).filter((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          return socket && socket.connected;
        });

        if (activeSockets.length === 0) {
          userSocketMap.delete(userId);
          userStatusMap.set(userId, false);
          io.emit("userStatusChanged", { userId, isOnline: false });
        } else {
          sockets.clear();
          activeSockets.forEach((socketId) => sockets.add(socketId));
        }
      });
      updateOnlineUsers();
    }, 30000); // Run every 30 seconds

    // Make io instance available to the app
    app.set("io", io);
    app.set("userSocketMap", userSocketMap);
    app.set("userStatusMap", userStatusMap);

    server.listen(port, () => {
      console.log(`Server is running on port: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit if we can't start the server
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();
