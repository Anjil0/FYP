const express = require("express");
const { upcomingSessions, getTodaySessions } = require("./sessionController");
const { authenticateToken, isUser } = require("../middlewares/authHandle");

const sessionRouter = express.Router();

sessionRouter.get("/todaySessions", authenticateToken, getTodaySessions);

module.exports = sessionRouter;
