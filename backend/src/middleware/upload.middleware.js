import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/*
 * CloudinaryStorage streams files directly from the request to Cloudinary.
 * Files are NEVER written to disk — this is safe for serverless/production.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vendra/products",    // Cloudinary folder path
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 1200,
        height: 1200,
        crop: "limit",  // Resize but don't upscale — preserves originals
        quality: "auto:good",
      },
    ],
  },
});

/*
 * MIME type filter — called before each file is accepted.
 * Blocks non-image files before they reach Cloudinary.
 */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,                   // Max 5 files per request
  },
});

/*
 * Exported middleware variants:
 *   uploadSingle   — for vendor logo (single file)
 *   uploadMultiple — for product images (up to 5 files)
 */
export const uploadSingle = upload.single("image");
export const uploadMultiple = upload.array("images", 5);
