import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "Beginner",
    },
    price: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      enum: ["English", "French", "Spanish"],
      default: "English",
    },
    thumbnail: {
      type: String, // URL to the image
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chapters: [
      {
        title: { type: String },
        lessons: [
          {
            title: { type: String },
            videoUrl: { type: String },
            duration: { type: String }, // Optional: lesson length
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
