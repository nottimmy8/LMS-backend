import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getTutorStats,
  getRecentCourses,
  getTutorChartData,
} from "../controllers/tutor.controller.js";

const router = express.Router();

// All tutor routes are protected and restricted to the 'tutor' role
router.use(protect);
router.use(authorizeRoles("tutor"));

// Dashboard Stats (Total Students, Courses, Earnings)
router.get("/stats", getTutorStats);

// Recent Courses (Last 5 updated courses)
router.get("/recent-courses", getRecentCourses);

// Chart Data (Monthly Analytics)
router.get("/chart-data", getTutorChartData);

export default router;
