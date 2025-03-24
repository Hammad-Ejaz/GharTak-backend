// routes/product.routes.js
import express from "express";
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
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/",verifyJWT, getAllProducts);
router.get("/:productId",verifyJWT, getProductById);
router.get("/category/:category",verifyJWT, getProductsByCategory);

// Admin-only routes
router.post(
  "/",
  verifyJWT,
  verifyAdmin,
  upload.single("image"),
  createProduct
);

router.patch(
  "/:productId",
  verifyJWT,
  verifyAdmin,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:productId",
  verifyJWT,
  verifyAdmin,
  deleteProduct
);

router.patch(
  "/stock/:productId",
  verifyJWT,
  verifyAdmin,
  updateStock
);

export default router;