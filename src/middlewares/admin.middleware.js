import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, _, next) => {
  try {
    // Check if user exists (assuming verifyJWT already attached it to req.user)
    if (!req.user) {
      throw new apiError(401, "Unauthorized: User not authenticated");
    }

    // Check if user is admin
    if (!req.user.admin) {
      throw new apiError(403, "Forbidden: Admin access required");
    }

    next();
  } catch (error) {
    throw new apiError(error.statusCode || 401, error.message);
  }
});