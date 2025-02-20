const express = require("express");
const cors = require("cors");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const globalErrorHandler = require("./middlewares/globalErrorHandler");
const userRouter = require("./users/userRouter");
const tutorRouter = require("./tutors/tutorRouter");
const timeSlotRouter = require("./timeSlots/timeSlotRouter");
const bookingRouter = require("./booking/bookingRouter");
const paymentRouter = require("./payment/paymentRouter");
const messageRouter = require("./message/messageRouter");
const notificationRouter = require("./notification/notificationRouter");

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TutorEase's API's" });
});

app.use("/api/users", userRouter);
app.use("/api/tutors", tutorRouter);
app.use("/api/timeSlots", timeSlotRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/messages", messageRouter);
app.use("/api/notifications", notificationRouter);

app.use(globalErrorHandler);

module.exports = app;
