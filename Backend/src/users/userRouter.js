const express = require("express");
const {
  authenticateToken,
  isAdmin,
  isUser,
} = require("../middlewares/authHandle");

const {
  registerUser,
  loginUser,
  handleLogout,
  getUserDetails,
  toggleRole,
  verifyEmail,
  resendVerificationCode,
  resetPassword,
  forgotPassword,
  verifyResetLink,
  updateUserDetails,
  getAdminDashboard,
} = require("./userController");

const upload = require("../middlewares/multerConfig");
const { previewReport, downloadReport } = require("../utils/reportGeneration");

const userRouter = express.Router();

userRouter.post("/register", upload.single("image"), registerUser);

userRouter.post("/login", loginUser);

userRouter.post("/logout", handleLogout);

userRouter.get("/getUserDetails/", authenticateToken, isUser, getUserDetails);

userRouter.post("/verifyEmail", verifyEmail);

userRouter.post("/forgotPassword", forgotPassword);

userRouter.get("/verifyResetLink/:code", verifyResetLink);

userRouter.post("/resetPassword", resetPassword);

userRouter.post("/resendCode", resendVerificationCode);

userRouter.put(
  "/updateUser",
  upload.single("image"),
  authenticateToken,
  isUser,
  updateUserDetails
);

userRouter.post("/toggleRole/:id", authenticateToken, toggleRole);

userRouter.get(
  "/getAdminDashboard/",
  authenticateToken,
  isAdmin,
  getAdminDashboard
);

userRouter.get("/reports/preview/", authenticateToken, isAdmin, previewReport);

userRouter.get(
  "/reports/download/",
  authenticateToken,
  isAdmin,
  downloadReport
);
module.exports = userRouter;
