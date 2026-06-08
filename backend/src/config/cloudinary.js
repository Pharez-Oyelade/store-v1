import { v2 as cloudinary } from "cloudinary";

/*
 * Configure the Cloudinary SDK using credentials from environment variables.
 * This must be required early so all subsequent cloudinary calls are authenticated.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
