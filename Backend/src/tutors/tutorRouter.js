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
  getTutorProfile,
  getTutorDetails,
  updateTutorProfile,
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

tutorRouter.put(
  "/updateTutor",
  upload.single("image"),
  authenticateToken,
  isTutor,
  updateTutorProfile
);

tutorRouter.get("/getAllTutors", getAllTutors);

tutorRouter.get("/getVerifiedTutors", getVerifiedTutors);

tutorRouter.get("/getTutorProfile/", authenticateToken, getTutorProfile);

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
