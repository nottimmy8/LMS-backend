import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import tutorRoutes from "./routes/tutor.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://lms-nashles.vercel.app",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost") ||
        origin.includes("vercel.app") // Be a bit more flexible during setup
      ) {
        callback(null, true);
      } else {
        console.warn("CORS blocked for origin:", origin);
        // Instead of callback(new Error), just return false to let CORS middleware handle it
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json());

// Static folder for file uploads
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes); // New
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/tutor", tutorRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/notifications", notificationRoutes); // New
app.use("/api/v1/analytics", analyticsRoutes); // New

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
