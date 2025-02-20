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
} = require("./userController");

const upload = require("../middlewares/multerConfig");

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

userRouter.put("/updateUser", authenticateToken, isUser, updateUserDetails);

userRouter.post("/toggleRole/:id", authenticateToken, toggleRole);

module.exports = userRouter;
