const express = require("express");
const {
  authenticateToken,
  isAdmin,
  isTutor,
} = require("../middlewares/authHandle");

const {
  signupTutor,
  verifyTutor,
  getAllTutors,
  getVerifiedTutors,
  getAllUsers,
  getTutorDetails,
  toogleAvailability,
  getTutorDashboard,
} = require("./tutorController");

const upload = require("../middlewares/multerConfig");

const tutorRouter = express.Router();

tutorRouter.post(
  "/registerTutor",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "certificateImage", maxCount: 1 },
  ]),
  signupTutor
);

tutorRouter.get("/getAllTutors", getAllTutors);

tutorRouter.get("/getVerifiedTutors", getVerifiedTutors);

tutorRouter.get("/getTutorDetails/:id", getTutorDetails);

tutorRouter.put(
  "/toogleAvailability/",
  authenticateToken,
  isTutor,
  toogleAvailability
);

tutorRouter.get(
  "/getTutorDashboardDetails/",
  authenticateToken,
  isTutor,
  getTutorDashboard
);

tutorRouter.post("/verifyTutor/:id", authenticateToken, isAdmin, verifyTutor);

tutorRouter.get("/getAllUsers", authenticateToken, isAdmin, getAllUsers);

module.exports = tutorRouter;
