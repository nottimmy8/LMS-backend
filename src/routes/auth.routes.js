import express from "express";
import {
  register,
  login,
  verifyOtp,
  verifyResetOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
  me,
} from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  validateRequest,
} from "../middleware/validation.middleware.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerValidation, validateRequest, register);
router.post("/verify-otp", verifyOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginValidation, validateRequest, login);

router.post("/forgot-password", forgotPassword);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validateRequest,
  resetPassword,
);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me", me);

export default router;
