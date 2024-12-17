const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const userModel = require("../users/userModel");
const config = require("../config/config");

const authenticateToken = (req, res, next) => {
  const accessToken = req.headers["authorization"];
  if (!accessToken) {
    return next(createError(401, "Access Token not found"));
  }

  const token = accessToken.split(" ")[1];
  if (!token) {
    return next(createError(401, "Token is not valid"));
  }

  try {
    const verified = jwt.verify(token, config.jwtSecret);
    req.user = verified;

    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (verified.exp < currentTimestamp) {
      return next(createError(401, "Token has expired"));
    }
    next();
  } catch (err) {
    next(createError(500, "Invalid Token"));
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.sub);
    if (!user || user.role !== "admin") {
      return next(createError(403, "You are not admin."));
    }
    next();
  } catch (err) {
    next(createError(500, "Server Error"));
  }
};

const verifyUserId = (req, res, next) => {
  const userId = req.params.id;
  if (req.user.sub !== userId) {
    return next(createError(403, "Access Denied. User ID does not match."));
  }
  next();
};

const isUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.sub);
    if (!user || user.role !== "user") {
      return next(createError(403, "Access Denied"));
    }
    next();
  } catch (err) {
    next(createError(500, "You are not allowed to access this user."));
  }
};

const isPartner = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.sub);
    if (
      !user ||
      !["Institute", "Organization", "School", "College"].includes(user.type)
    ) {
      return next(createError(403, "Access Denied. You are not a partner."));
    }
    next();
  } catch (err) {
    next(createError(500, "Server Error"));
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isUser,
  verifyUserId,
  isPartner,
};
