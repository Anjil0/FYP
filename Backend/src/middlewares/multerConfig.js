const multer = require("multer");
const path = require("path");

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 1e7 }, 
});

module.exports = upload;
