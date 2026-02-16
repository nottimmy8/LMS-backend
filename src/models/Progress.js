import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completedLessons: [
      {
        type: String, // Storing lesson IDs (as strings from nested curriculum)
      },
    ],
    lastAccessedLesson: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Unique progress per student per course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
