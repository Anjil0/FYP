const jwt = require("jsonwebtoken");
const config = require("../config/config");

const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "80m" });
};

module.exports = {
  generateAccessToken,
};
