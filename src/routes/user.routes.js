// routes/user.routes.js
import express from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import {
  getCurrentUser,
  updateUserProfile,
  updateUserLocation,
  updateUserCredits,
  getAllUsers
} from "../controllers/user.controller.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Authenticated user routes
router.get("/current", requireAuth(), getCurrentUser);
router.patch("/profile", requireAuth(), updateUserProfile);
router.patch("/location", requireAuth(), updateUserLocation);

// Admin-only user routes
router.get("/all", requireAuth(), verifyAdmin, getAllUsers);
router.patch("/credits/:userId", requireAuth(), verifyAdmin, updateUserCredits);

export default router;