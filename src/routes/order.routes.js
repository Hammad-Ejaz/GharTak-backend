import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
    verifyJWT,
    upload.single("paymentScreenshot"),
    placeOrder
);

router.get(
    "/my-orders",
    verifyJWT,
    getUserOrders
);

// Admin routes
router.get(
    "/",
    verifyJWT,
    verifyAdmin,
    getAllOrders
);

router.get(
    "/nearby",
    verifyJWT,
    verifyAdmin,
    getNearbyOrders
);

router.patch(
    "/:orderId/status",
    verifyJWT,
    verifyAdmin,
    updateOrderStatus
);

router.patch(
    "/:orderId/payment-status",
    verifyJWT,
    verifyAdmin,
    verifyPayment
);

export default router;