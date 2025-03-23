const app = require("./src/app");
const connectDB = require("./src/config/dbConnect");
const http = require("http");
const initializeSockets = require("./socket");
const checkOverdueAssignments = require("./src/cronJobs/assignmentCron");
const updateBookingStatuses = require("./src/cronJobs/bookingCron");

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    // Initialize Socket.IO
    const { io, userSocketMap, userStatusMap } = initializeSockets(server);

    // Attach instances to app for use elsewhere
    app.set("io", io);
    app.set("userSocketMap", userSocketMap);
    app.set("userStatusMap", userStatusMap);

    server.listen(port, () => {
      console.log(`🚀 Server is running on: http://localhost:${port}`);
    });

    // Start the assignment overdue check cron job
    checkOverdueAssignments();
    updateBookingStatuses();
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();
