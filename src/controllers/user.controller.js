import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

// Get current authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ clerkUserId: req.auth.userId })
    .select("-__v -createdAt -updatedAt");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "Current user fetched successfully"));
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  
  const user = await User.findOneAndUpdate(
    { clerkUserId: req.auth.userId },
    { $set: { name, phone, address } },
    { new: true, runValidators: true }
  ).select("-__v -createdAt -updatedAt");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "Profile updated successfully"));
});

// Update user location (with geospatial data)
const updateUserLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude } = req.body;

  if (!longitude || !latitude) {
    throw new apiError(400, "Longitude and latitude are required");
  }

  const user = await User.findOneAndUpdate(
    { clerkUserId: req.auth.userId },
    { 
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    },
    { new: true }
  ).select("-__v -createdAt -updatedAt");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Location updated successfully"));
});

// Admin: Update user credits
const updateUserCredits = asyncHandler(async (req, res) => {
  if (req.auth.role !== "admin") {
    throw new apiError(403, "Unauthorized: Admin access required");
  }

  const { userId } = req.params;
  const { amount } = req.body;

  if (!amount || typeof amount !== "number") {
    throw new apiError(400, "Valid amount is required");
  }

  const user = await User.findOne({ clerkUserId: userId });
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  user.creditBalance += amount;
  if (user.creditBalance < 0) {
    throw new apiError(400, "Credit balance cannot be negative");
  }

  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, user, "Credits updated successfully"));
});

// Admin: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  if (req.auth.role !== "admin") {
    throw new apiError(403, "Unauthorized: Admin access required");
  }

  const users = await User.find({})
    .select("-__v -createdAt -updatedAt");

  return res
    .status(200)
    .json(new apiResponse(200, users, "All users retrieved successfully"));
});

export {
  getCurrentUser,
  updateUserProfile,
  updateUserLocation,
  updateUserCredits,
  getAllUsers
};