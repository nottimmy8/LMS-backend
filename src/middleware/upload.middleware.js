import multer from "multer";
import path from "path";
import fs from "fs";

// Cloudinary handling - memory storage used below

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Thumbnail must be an image"), false);
    }
  } else if (file.fieldname.startsWith("video-")) {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Lesson content must be a video"), false);
    }
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter,
});
