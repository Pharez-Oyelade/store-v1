import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,  // Conservative pool size for M0 Free Tier
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production", // Prevent index builds in prod
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    process.exit(1);
  }
};

export default connectDB;
