const express = require("express");
const {
  authenticateToken,
  isAdmin,
  isUser,
  verifyUserId,
} = require("c:/Users/angil/Desktop/Internship/CTF-server-side/src/middlewares/authHandle");

const {
  registerUser,
  loginUser,
  handleLogout,
  getAllUsers,
  getUserById,
  refreshAccessToken,
  getUserSolvedQuizes,
  getUserDetails,
  getAdminDashboard,
  toggleRole,
  getRank,
} = require("./userController");

const upload = require("c:/Users/angil/Desktop/Internship/CTF-server-side/src/middlewares/multerConfig");

const userRouter = express.Router();

userRouter.post("/register", upload.single("image"), registerUser);

userRouter.post("/login", loginUser);

userRouter.post("/logout", handleLogout);

userRouter.get("/getAllUsers", authenticateToken, isAdmin, getAllUsers);

userRouter.get(
  "/profile/:id",
  authenticateToken,
  verifyUserId,
  isUser,
  getUserById
);

userRouter.get(
  "/getUserDetails/:id",
  authenticateToken,
  isUser,
  getUserDetails
);

userRouter.post("/refreshAccessToken", refreshAccessToken);

userRouter.get("/getUserSolvedQuizes/:id", getUserSolvedQuizes);

userRouter.get(
  "/getAdminDashboard",
  authenticateToken,
  isAdmin,
  getAdminDashboard
);
userRouter.post("/toggleRole/:id", authenticateToken, toggleRole);

userRouter.get("/getUserRank", authenticateToken, getRank);

module.exports = userRouter;
