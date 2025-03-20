// routes/service.routes.js
import express from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import {
  createService,
  updateService,
  getAllServices,
  getServiceById,
  deleteService,
  getServicesByCategory
} from "../controllers/service.controller.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllServices);
router.get("/:serviceId", getServiceById);
router.get("/category/:category", getServicesByCategory);

// Admin-only routes
router.post(
  "/",
  requireAuth(),
  verifyAdmin,
  upload.single("image"),
  createService
);

router.patch(
  "/:serviceId",
  requireAuth(),
  verifyAdmin,
  upload.single("image"),
  updateService
);

router.delete(
  "/:serviceId",
  requireAuth(),
  verifyAdmin,
  deleteService
);

export default router;