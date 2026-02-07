import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  createCourse,
  getTutorCourses,
  updateCourse,
  getCourseById,
  unpublishCourse,
  deleteCourse,
  getPublishedCourses,
} from "../controllers/course.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

/* =========================
   Public Routes (No Auth Required)
========================= */

// Get all published courses (for students/visitors)
router.get("/public", getPublishedCourses);

/* =========================
   Tutor Routes
========================= */

// Create new course as draft
router.post(
  "/save-draft",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  createCourse,
);

// Create and publish new course directly
router.post(
  "/publish",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  createCourse,
);

// Get all courses created by the tutor
router.get("/tutor-courses", protect, authorizeRoles("tutor"), getTutorCourses);

// Update existing course as draft
router.patch(
  "/save-draft/:id",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  updateCourse,
);

// Update and publish existing course
router.patch(
  "/publish/:id",
  protect,
  authorizeRoles("tutor"),
  upload.any(),
  updateCourse,
);

// Unpublish a course (change to draft)
router.patch(
  "/unpublish/:id",
  protect,
  authorizeRoles("tutor"),
  unpublishCourse,
);

// Delete a course (with file cleanup)
router.delete("/:id", protect, authorizeRoles("tutor"), deleteCourse);

/* =========================
   General Routes (Authenticated)
========================= */

// Get single course by ID
router.get("/:id", protect, getCourseById);

export default router;
