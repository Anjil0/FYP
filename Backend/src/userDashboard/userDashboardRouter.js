const express = require("express");
const userDashboardRouter = express.Router();
const dashboardController = require("./userDashboardController");
const { authenticateToken } = require("../middlewares/authHandle");

userDashboardRouter.use(authenticateToken);

// Get dashboard overview data
userDashboardRouter.get("/overview", dashboardController.getDashboardOverview);

// Get upcoming sessions
userDashboardRouter.get(
  "/upcoming-sessions",
  dashboardController.getUpcomingSessions
);

// Get recent messages
userDashboardRouter.get(
  "/recent-messages",
  dashboardController.getRecentMessages
);

// Get assigned tutors
userDashboardRouter.get("/my-tutors", dashboardController.getMyTutors);

// Get past assignments
userDashboardRouter.get(
  "/past-assignments",
  dashboardController.getPastAssignments
);

// Get session analytics/stats
userDashboardRouter.get("/analytics", dashboardController.getSessionAnalytics);

module.exports = userDashboardRouter;
