const express = require("express");
const { getRecommendedTutors } = require("./recommendationController");
const { authenticateToken, isUser } = require("../middlewares/authHandle");

const recommendationRouter = express.Router();

recommendationRouter.get(
  "/recommend/",
  authenticateToken,
  isUser,
  getRecommendedTutors
);

module.exports = recommendationRouter;


