const express = require("express");
const bookingRouter = express.Router();
const {
  createBooking,
  tutorConfirmBooking,
  getTutorChatBookings,
  updatePhysicalPaymentStatus,
  getStudentBookings,
  getAllTutors,
  getTutorBookings,
  getAllTutorinChat,
  cancelBooking,
} = require("./bookingController");

const {
  authenticateToken,
  isTutor,
  isUser,
} = require("../middlewares/authHandle");

// Create new booking (Student)
bookingRouter.post("/createBooking", authenticateToken, createBooking);

// Confirm booking (Tutor)
bookingRouter.put(
  "/confirm/:bookingId",
  authenticateToken,
  tutorConfirmBooking
);

bookingRouter.put(
  "/cancel/:bookingId",
  authenticateToken,
  isTutor,
  cancelBooking
);

bookingRouter.put(
  "/payment/physical/:bookingId",
  authenticateToken,
  updatePhysicalPaymentStatus
);

// Get bookings for student
bookingRouter.get(
  "/studentBookings",
  authenticateToken,
  isUser,
  getStudentBookings
);

bookingRouter.get("/getAllTutors/", authenticateToken, isUser, getAllTutors);

bookingRouter.get(
  "/getAllTutorinChat",
  authenticateToken,
  isUser,
  getAllTutorinChat
);

// Get bookings for tutor
bookingRouter.get(
  "/tutorBookings",
  authenticateToken,
  isTutor,
  getTutorBookings
);

bookingRouter.get(
  "/getTutorChatBookings",
  authenticateToken,
  isTutor,
  getTutorChatBookings
);

module.exports = bookingRouter;
