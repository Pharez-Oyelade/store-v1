import cloudinary from "../config/cloudinary.js";

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
