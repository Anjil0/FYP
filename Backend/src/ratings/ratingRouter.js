const express = require("express");
const {
  giveRating,
  getRatings,
  getRatingsByTutorId,
  getAllRatings,
} = require("./ratingController");
const {
  authenticateToken,
  isUser,
  isAdmin,
} = require("../middlewares/authHandle");

const ratingRouter = express.Router();

ratingRouter.post("/giveRating/", authenticateToken, isUser, giveRating);
ratingRouter.get("/getRatings/:bookingId", authenticateToken, getRatings);
ratingRouter.get("/getRatingsByTutorId/:id", getRatingsByTutorId);
ratingRouter.get("/getAllRatings/", getAllRatings);

module.exports = ratingRouter;
