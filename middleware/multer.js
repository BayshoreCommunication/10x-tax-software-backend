
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Set up Cloudinary storage

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpeg", "png", "jpg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

// Initialize multer with the configured storage and file size limit
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Middleware for single image upload
const uploadSingle = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {

      req.file = undefined;
    }

    next();
  });
};

module.exports = {
  uploadSingle,
};
