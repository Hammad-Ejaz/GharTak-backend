import express from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
import {
    createPayment,
    getPaymentHistory,
    updatePaymentStatus,
    getAllPayments,
    getPaymentById
} from "../controllers/payment.controller.js";

const router = express.Router();

// User routes
router.post(
    "/",
    requireAuth(),
    upload.single("screenshot"),
    createPayment
);

router.get(
    "/history",
    requireAuth(),
    getPaymentHistory
);

// Admin routes
router.get(
    "/",
    requireAuth(),
    verifyAdmin,
    getAllPayments
);

router.get(
    "/:paymentId",
    requireAuth(),
    verifyAdmin,
    getPaymentById
);

router.patch(
    "/:paymentId/status",
    requireAuth(),
    verifyAdmin,
    updatePaymentStatus
);

export default router;