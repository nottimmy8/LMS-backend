import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getTutorAnalytics,
  getMyCertificates,
  getStudentAnalytics,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.use(protect);

// Tutor Analytics
router.get("/tutor", authorizeRoles("tutor", "admin"), getTutorAnalytics);

// Student Analytics
router.get("/student", authorizeRoles("student"), getStudentAnalytics);

// Student Certificates (Keep in analytics for now as grouped in controller, but route logically)
router.get("/certificates", authorizeRoles("student"), getMyCertificates);

export default router;
