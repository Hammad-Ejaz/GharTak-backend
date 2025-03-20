// middlewares/admin.middleware.js
import { apiError } from "../utils/apiError.js";

export const verifyAdmin = (req, res, next) => {
  if (req.auth.role !== "admin") {
    return next(
      new apiError(403, "Unauthorized: Admin access required")
    );
  }
  next();
};