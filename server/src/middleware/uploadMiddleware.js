const multer = require('multer');
const path = require('path');

// Memory storage to process files directly in buffer
const storage = multer.memoryStorage();

// Validate file type
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedExtensions = ['.pdf', '.txt', '.docx'];

  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF documents, DOCX, and TXT files are supported.'
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;
