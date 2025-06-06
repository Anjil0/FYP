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
const assignmentRouter = require("./assignments/assignmentsRouter");
const ratingRouter = require("./ratings/ratingRouter");
const recommendationRouter = require("./recommendation/recommendationRouter");
const userDashboardRouter = require("./userDashboard/userDashboardRouter");
const tutorDashboardRouter = require("./tutorDashboard/tutorDashboardRouter");

const corsOptions = {
  // origin: "http://192.168.18.3:5173",
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
app.use("/api/assignments", assignmentRouter);
app.use("/api/ratings", ratingRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/dashboard", userDashboardRouter);
app.use("/api/Tdashboard", tutorDashboardRouter);

app.use(globalErrorHandler);

module.exports = app;
