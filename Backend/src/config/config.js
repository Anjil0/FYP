const dotenv = require("dotenv");
dotenv.config();

const _config = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_MONG0_URL,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  BACKEND_URL: process.env.BACKEND_URL,
  cloudinaryCloud: process.env.CLOUDINARY_CLOUD,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
  gmailUser: process.env.GMAIL_USER,
  gmailPass: process.env.GMAIL_PASS,
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY,
  khaltiPublicKey: process.env.KHALTI_PUBLIC_KEY,
  khaltiURL: process.env.KHALTI_URL,
};

module.exports = Object.freeze(_config);
