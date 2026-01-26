import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";

console.log("APP.JS LOADED");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
  res.send("LMS API running");
});

app.use("/api/v1/auth", authRoutes);

export default app;
