import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createCourse,
  getMyCourses,
} from "../controllers/course.controller.js";

const router = express.Router();

// Tutor-only route
router.post("/create", protect, authorizeRoles("tutor"), createCourse);

// Student-only route
router.get("/my-courses", protect, authorizeRoles("student"), getMyCourses);

export default router;
