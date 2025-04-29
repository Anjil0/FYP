const express = require("express");
const {
  bookingPayment,
  completeKhaltiPayment,
} = require("./paymentController");
const { authenticateToken, isUser } = require("../middlewares/authHandle");

const paymentRouter = express.Router();

paymentRouter.post("/payBooking", authenticateToken,isUser, bookingPayment);
paymentRouter.get("/completeKhaltiPayment", completeKhaltiPayment);

module.exports = paymentRouter;
