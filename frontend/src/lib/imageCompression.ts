/**
 * Client-Side Image Compression Utility
 * Resizes and compresses heavy smartphone/camera photos (5MB - 15MB) down to web-optimized JPEGs (~200KB - 400KB).
 * Operates purely client-side with zero external dependencies using the HTML5 Canvas API.
 */

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  // If not in a browser environment or not an image file, return original
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // If already under 350KB, skip heavy compression
  if (file.size <= 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Downscale maintaining aspect ratio if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // If 2D context fails, fallback safely to original file
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If canvas output is somehow larger than original, return original
              return resolve(file);
            }

            const newFileName = file.name.replace(/\.[^.]+$/, ".jpg");
            const compressedFile = new File([blob], newFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an array of image files in parallel.
 */
export async function compressImages(
  files: File[],
  maxDimension = 1600,
  quality = 0.82
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, maxDimension, quality)));
}
