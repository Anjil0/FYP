const path = require("path");
const fs = require("fs").promises;
const cloudinary = require("../config/coludinary");

const uploadToCloudinary = async (filePath, folder, filename, format) => {
  try {
    // Ensure public_id uses the original filename without special characters
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .split(".")[0];
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: sanitizedFilename,
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

const extractPublicId = (fileUrl, fileType) => {
  const parts = fileUrl.split("/");
  const filename = parts[parts.length - 1].split(".")[0]; 

  const folder =
    fileType === "image"
      ? "TutorEase/AssignmentImages"
      : "TutorEase/AssignmentFiles";

  return `${folder}/${filename}`;
};

module.exports = { uploadToCloudinary, getFilePath, extractPublicId };
