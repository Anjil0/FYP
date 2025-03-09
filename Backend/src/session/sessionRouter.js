const express = require("express");
const { upcomingSessions } = require("./sessionController");
const { authenticateToken, isUser } = require("../middlewares/authHandle");

const sessionRouter = express.Router();

sessionRouter.get("/upcomingSessions", authenticateToken, upcomingSessions);

module.exports = sessionRouter;
