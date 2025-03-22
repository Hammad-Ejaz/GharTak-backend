import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


// Generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating access and refresh tokens");
  }
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password, admin, location } = req.body;

  // Ensure required fields are provided
  if ([fullName, email, username, password].some(field => !field || field.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  // Validate location format
  if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    throw new apiError(400, "Invalid location: Coordinates must be an array of [longitude, latitude]");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    admin: admin || false,
    location: {
      type: "Point",
      coordinates: location.coordinates,
    },
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken -__v");
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User registered successfully"));
});


// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new apiError(400, "Username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -__v");

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.header("x-refresh-token") ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.cookies.refreshToken ||
    req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request: Refresh token missing");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token: User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Refresh token is expired or has been used");
    }

    const options = { httpOnly: true, secure: true };
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new apiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

// Change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || oldPassword.trim() === "" || newPassword.trim() === "") {
    throw new apiError(400, "Both old and new passwords are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

// Delete user (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (!currentUser.admin) {
    throw new apiError(403, "Unauthorized access");
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (id === currentUser._id.toString()) {
    throw new apiError(400, "Cannot delete your own account");
  }

  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "User deleted successfully"));
});

// Get current authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken -__v");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "Current user fetched successfully"));
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, address } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, phone, address } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -__v");

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

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    },
    { new: true }
  ).select("-password -refreshToken -__v");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Location updated successfully"));
});

// Admin: Update user credits
const updateUserCredits = asyncHandler(async (req, res) => {
  if (!req.user.admin) {
    throw new apiError(403, "Unauthorized: Admin access required");
  }

  const { userId } = req.params;
  const { amount } = req.body;

  if (!amount || typeof amount !== "number") {
    throw new apiError(400, "Valid amount is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new apiError(404, "User not found");
  }

  user.creditBalance += amount;
  if (user.creditBalance < 0) {
    throw new apiError(400, "Credit balance cannot be negative");
  }

  await user.save();

  const updatedUser = await User.findById(userId)
    .select("-password -refreshToken -__v");

  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Credits updated successfully"));
});

// Admin: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  if (!req.user.admin) {
    throw new apiError(403, "Unauthorized: Admin access required");
  }

  const users = await User.find({})
    .select("-password -refreshToken -__v");

  return res
    .status(200)
    .json(new apiResponse(200, users, "All users retrieved successfully"));
});

export {
  generateAccessAndRefreshTokens,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  deleteUser,
  getCurrentUser,
  updateUserProfile,
  updateUserLocation,
  updateUserCredits,
  getAllUsers
};