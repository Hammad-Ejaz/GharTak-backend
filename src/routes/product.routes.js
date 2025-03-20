// routes/product.routes.js
import express from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateStock,
  getProductsByCategory
} from "../controllers/product.controller.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:productId", getProductById);
router.get("/category/:category", getProductsByCategory);

// Admin-only routes
router.post(
  "/",
  requireAuth(),
  verifyAdmin,
  upload.single("image"),
  createProduct
);

router.patch(
  "/:productId",
  requireAuth(),
  verifyAdmin,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:productId",
  requireAuth(),
  verifyAdmin,
  deleteProduct
);

router.patch(
  "/stock/:productId",
  requireAuth(),
  verifyAdmin,
  updateStock
);

export default router;