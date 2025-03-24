import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create payment (User)
const createPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  if (!req.file) {
    throw new apiError(400, "Payment screenshot is required");
  }

  // Upload screenshot to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
  if (!cloudinaryResponse?.url) {
    throw new apiError(500, "Failed to upload payment screenshot");
  }

  const payment = await Payment.create({
    user: req.user._id,
    amount,
    screenshot: cloudinaryResponse.url,
  });

  return res
    .status(201)
    .json(new apiResponse(201, payment, "Payment recorded successfully"));
});

// Get payment history (User)
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("user", "name email");

  return res
    .status(200)
    .json(new apiResponse(200, payments, "Payment history retrieved"));
});

// Update payment status (Admin)
const updatePaymentStatus = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can update payment status");
  }

  const { paymentId } = req.params;
  const { status } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    throw new apiError(400, "Invalid payment status");
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new apiError(404, "Payment not found");
  }

  // Prevent modification of already processed payments
  if (payment.status !== "pending") {
    throw new apiError(400, "Payment has already been processed");
  }

  payment.status = status;  
  const updatedPayment = await payment.save();

  // Add credits if verified
  if (status === "verified") {
    const user = await User.findById(payment.user);
    if (!user) {
      throw new apiError(404, "User not found");
    }
    
    user.creditBalance += payment.amount;
    await user.save();
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedPayment, "Payment status updated"));
});

// Get all payments (Admin)
const getAllPayments = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can view payments");
  }

  // Get all payments sorted with pending first and oldest first within each status
  const payments = await Payment.find({})
    .sort({ 
      status: 1,  // 1 for ascending (pending comes first in enum order)
      createdAt: 1  // Oldest payments first within same status
    })
    .populate('user', 'username email');

  return res
    .status(200)
    .json(new apiResponse(200, payments, "Payments retrieved successfully"));
});

// Get single payment (Admin)
const getPaymentById = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can view payment details");
  }
  
  const payment = await Payment.findById(req.params.paymentId)
    .populate("user", "name email");

  if (!payment) {
    throw new apiError(404, "Payment not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, payment, "Payment details retrieved"));
});

export {
  createPayment,
  getPaymentHistory,
  updatePaymentStatus,
  getAllPayments,
  getPaymentById
};
