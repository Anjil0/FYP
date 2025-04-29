// routes/tutorDashboardRoutes.js
const express = require("express");
const tutorDashboardRouter = express.Router();
const tutorDashboardController = require("./tutorDashboardController");
const { authenticateToken, isTutor } = require("../middlewares/authHandle");

// Apply authentication middleware to all routes
tutorDashboardRouter.use(authenticateToken, isTutor);

// Get tutor dashboard details
tutorDashboardRouter.get(
  "/getTutorDashboardDetails",
  tutorDashboardController.getTutorDashboardDetails
);

// Toggle tutor availability
tutorDashboardRouter.put(
  "/toggleAvailability",
  tutorDashboardController.toggleAvailability
);
// Get recent assignments
tutorDashboardRouter.get(
  "/recentAssignments",
  tutorDashboardController.getRecentAssignments
);
// Get earnings statistics
tutorDashboardRouter.get(
  "/earningsStats",
  tutorDashboardController.getEarningsStats
);
// Get upcoming sessions
tutorDashboardRouter.get(
  "/upcomingSessions",
  tutorDashboardController.getUpcomingSessions
);

module.exports = tutorDashboardRouter;
