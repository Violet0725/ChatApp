const path = require('path');
const fs = require('fs');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * @desc    Upload a file (image or document)
 * @route   POST /api/upload
 * @access  Public
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('No file uploaded', 400);
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Public
 */
const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError('No files uploaded', 400);
  }

  const files = req.files.map(file => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));

  res.json({
    success: true,
    data: files,
  });
});

module.exports = {
  uploadFile,
  uploadMultiple,
};
