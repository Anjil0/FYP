const cloudinary = require("cloudinary").v2;
const config = require("./config");

cloudinary.config({
  cloud_name: config.cloudinaryCloud,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinarySecret,
});

module.exports = cloudinary;
