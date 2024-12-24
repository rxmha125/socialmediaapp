const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, './public/images/uploads'); // Ensure this path exists
  },
  filename: (req, file, cb) => {
      const uniqueName = crypto.randomBytes(12).toString('hex') + path.extname(file.originalname);
      cb(null, uniqueName);
  },
});


// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed.")); // Reject the file
    }
};

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = allowedTypes.test(file.mimetype);
      if (extName && mimeType) {
          cb(null, true);
      } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
      }
  },
});
module.exports = upload;


module.exports = upload;
