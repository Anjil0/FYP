const app = require("./src/app");
const connectDB = require("./src/config/dbConnect");
const http = require("http");
const socketIo = require("socket.io");
const config = require("./src/config/config");

const startServer = async () => {
  await connectDB();
  const port = process.env.port || 3000;

  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  io.on("connection", (socket) => {
    socket.on("register", (userId) => {
      if (
        userSocketMap.has(userId) &&
        userSocketMap.get(userId) === socket.id
      ) {
        return;
      }

      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID ${socket.id}`);
    });

    socket.on("unregister", () => {
      let userIdToRemove = null;
      userSocketMap.forEach((value, key) => {
        if (value === socket.id) {
          userIdToRemove = key;
        }
      });

      if (userIdToRemove) {
        userSocketMap.delete(userIdToRemove);
        console.log(
          `User ${userIdToRemove} disconnected and removed from the map`
        );
      }
    });
  });

  app.set("io", io);
  app.set("userSocketMap", userSocketMap);

  server.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${config.PORT}`);
  });
};

startServer();
