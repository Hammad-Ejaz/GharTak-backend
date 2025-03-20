import express from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
import {
    placeOrder,
    getUserOrders,
    updateOrderStatus,
    getAllOrders,
    verifyPayment,
    getNearbyOrders
} from "../controllers/order.controller.js";

const router = express.Router();

// User routes
router.post(
    "/",
    requireAuth(),
    upload.single("paymentScreenshot"),
    placeOrder
);

router.get(
    "/my-orders",
    requireAuth(),
    getUserOrders
);

// Admin routes
router.get(
    "/",
    requireAuth(),
    verifyAdmin,
    getAllOrders
);

router.get(
    "/nearby",
    requireAuth(),
    verifyAdmin,
    getNearbyOrders
);

router.patch(
    "/:orderId/status",
    requireAuth(),
    verifyAdmin,
    updateOrderStatus
);

router.patch(
    "/:orderId/payment-status",
    requireAuth(),
    verifyAdmin,
    verifyPayment
);

export default router;