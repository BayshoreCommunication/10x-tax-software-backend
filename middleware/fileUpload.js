const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads"); // Ensure the path is correct for your setup

    // Check if the directory exists; if not, create it
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // Use the directory as the upload destination
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Add timestamp to file name
  },
});

// File type filter (e.g., accept only PDFs, images, etc.)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /pdf|jpg|jpeg|png/; // Add extensions you want to allow
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed!")); // Reject file
  }
};

// Configure multer with storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Limit file size to 5MB
});

// Middleware for single file upload
const uploadFileMiddleware = upload.single("file"); // "file" should match the key in your form-data

module.exports = { uploadFileMiddleware };
