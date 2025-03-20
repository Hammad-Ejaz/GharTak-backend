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
        user: req.auth.userId,
        amount,
        screenshot: cloudinaryResponse.url
    });

    return res
        .status(201)
        .json(new apiResponse(201, payment, "Payment recorded successfully"));
});

// Get payment history (User)
const getPaymentHistory = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ user: req.auth.userId })
        .sort({ createdAt: -1 })
        .populate("user", "name email");

    return res
        .status(200)
        .json(new apiResponse(200, payments, "Payment history retrieved"));
});

// Update payment status (Admin)
const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { status, reason } = req.body;

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
    if (reason) payment.reason = reason;
    
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
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
        .sort({ createdAt: -1 })
        .populate("user", "name email");

    return res
        .status(200)
        .json(new apiResponse(200, payments, "Payments retrieved successfully"));
});

// Get single payment (Admin)
const getPaymentById = asyncHandler(async (req, res) => {
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