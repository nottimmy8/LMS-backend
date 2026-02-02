import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  createCourse,
  getTutorCourses,
  updateCourse,
  getCourseById,
} from "../controllers/course.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Tutor-only routes

// Specific endpoints for Draft and Publish
router.post(
  "/save-draft",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  createCourse, // Controller will handle status based on body or URL if we refactor
);

router.post(
  "/publish",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  createCourse,
);

router.get("/tutor-courses", protect, authorizeRoles("tutor"), getTutorCourses);
router.get("/:id", protect, getCourseById);

router.patch(
  "/save-draft/:id",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  updateCourse,
);

router.patch(
  "/publish/:id",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  updateCourse,
);

export default router;
