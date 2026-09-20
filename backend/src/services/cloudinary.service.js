import cloudinary from "../config/cloudinary.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";

/*
 * Delete a single image from Cloudinary by its publicId.
 * Called when a vendor removes a product image or replaces their logo.
 */
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Non-fatal — log but don't throw. A failed delete shouldn't break the request.
    console.error(`[Cloudinary] Failed to delete image ${publicId}:`, err.message);
  }
}

/*
 * Delete multiple images in parallel.
 * Used when a product is deleted (clean up all its images).
 */
export async function deleteImages(publicIds = []) {
  await Promise.allSettled(publicIds.map(deleteImage));
}

/**
 * Upload multiple files to Cloudinary with automatic cleanup of uploaded images
 * if any file upload fails midway.
 */
export async function uploadMultipleImages(files = []) {
  if (!files || files.length === 0) return [];
  const uploaded = [];

  try {
    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer);
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
    return uploaded;
  } catch (err) {
    // Clean up any images that succeeded before failure occurred
    if (uploaded.length > 0) {
      console.warn(
        `[Cloudinary] Upload failed midway. Rolling back ${uploaded.length} orphaned image(s)...`
      );
      await deleteImages(uploaded.map((img) => img.publicId));
    }
    throw err;
  }
}
