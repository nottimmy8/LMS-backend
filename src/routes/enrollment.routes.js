import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  initiateEnrollment,
  verifyPayment,
  checkEnrollment,
  getMyLearning,
  updateProgress,
  getProgress,
} from "../controllers/enrollment.controller.js";

const router = express.Router();

// All enrollment routes require authentication
router.use(protect);

// Students can initiate and verify enrollment
router.post("/initiate", authorizeRoles("student"), initiateEnrollment);
router.post("/verify", authorizeRoles("student"), verifyPayment);
router.get("/check/:courseId", authorizeRoles("student"), checkEnrollment);

// My Learning & Progress
router.get("/my-learning", authorizeRoles("student"), getMyLearning);
router.post("/progress", authorizeRoles("student"), updateProgress);
router.get("/progress/:courseId", authorizeRoles("student"), getProgress);

export default router;
