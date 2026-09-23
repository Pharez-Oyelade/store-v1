/**
 * Validates critical environment variables at startup.
 * Fails fast with clear error logging if mandatory secrets are missing.
 */
export function validateEnv() {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌ [FATAL] Missing required environment variables: ${missing.join(", ")}`);
    console.error("Please configure these in your .env file or server environment before starting Vendra.\n");
    process.exit(1);
  }

  const recommended = [
    "PAYSTACK_SECRET_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "RESEND_API_KEY",
  ];
  const missingRecommended = recommended.filter((key) => !process.env[key]);

  if (missingRecommended.length > 0 && process.env.NODE_ENV === "production") {
    console.warn(`⚠️ [WARN] Missing recommended production environment variables: ${missingRecommended.join(", ")}`);
  }
}

export default validateEnv;
