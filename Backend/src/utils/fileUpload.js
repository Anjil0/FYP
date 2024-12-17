const path = require("path");
const fs = require("fs").promises;
const cloudinary = require("../config/coludinary");

const uploadToCloudinary = async (filePath, folder, filename, format) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: filename,
      resource_type: format === "pdf" ? "raw" : "image",
    });
    await fs.unlink(filePath);
    return result.secure_url;
  } catch (error) {
    await fs.unlink(filePath);
    throw error;
  }
};

const getFilePath = (filename) => {
  return path.resolve(__dirname, "../../public/data/uploads", filename);
};

module.exports = { uploadToCloudinary, getFilePath };
