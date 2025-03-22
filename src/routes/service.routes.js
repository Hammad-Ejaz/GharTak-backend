// routes/service.routes.js
import express from "express";
import {
  createService,
  updateService,
  getAllServices,
  getServiceById,
  deleteService,
  getServicesByCategory
} from "../controllers/service.controller.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Secure routes
router.get("/", verifyJWT, getAllServices);
router.get("/:serviceId",verifyJWT, getServiceById);
router.get("/category/:category", verifyJWT, getServicesByCategory);

// Admin-only routes
router.post(
  "/",
  verifyJWT,
  verifyAdmin,
  upload.single("image"),
  createService
);

router.patch(
  "/:serviceId",
  verifyJWT,
  verifyAdmin,
  upload.single("image"),
  updateService
);

router.delete(
  "/:serviceId",
  verifyJWT,
  verifyAdmin,
  deleteService
);

export default router;