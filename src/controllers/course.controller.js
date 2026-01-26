import Course from "../models/Course.js";

/* =========================
   Tutor: Create Course
========================= */
export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description required" });
    }

    // req.user is added by protect middleware
    const course = await Course.create({
      title,
      description,
      tutor: req.user._id,
    });

    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

/* =========================
   Student: Get My Courses
========================= */
export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get courses where user is enrolled as a student
    const courses = await Course.find({ students: userId }).populate(
      "tutor",
      "name email",
    );

    res.status(200).json({ courses });
  } catch (error) {
    console.error("GET MY COURSES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};
