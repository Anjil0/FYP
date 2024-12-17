const dotenv = require("dotenv");
dotenv.config();

const _config = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_MONG0_URL,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN,
  BACKEND_URL: process.env.BACKEND_URL,
  //   cloudinaryCloud: process.env.CLOUDINARY_CLOUD,
  //   cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  //   cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
};

module.exports = Object.freeze(_config);
