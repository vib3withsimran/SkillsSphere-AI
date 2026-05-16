import jwt from "jsonwebtoken";
import User from "../database/models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Auth for file downloads. Accepts JWT via Authorization header OR ?token= query
 * so <img src="..."> can load protected avatars without custom fetch logic.
 */
export const protectFileAccess = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (typeof req.query.token === "string" && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.userId).select("-password");

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    req.user = currentUser;
    next();
  } catch {
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
});
