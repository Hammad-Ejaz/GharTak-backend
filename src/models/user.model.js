import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"], // Ensures only "Point" type is allowed
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index on the location field
userSchema.index({ location: "2dsphere" });

export const User = mongoose.model("User", userSchema);