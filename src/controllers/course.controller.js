import Course from "../models/Course.js";

/* =========================
   Tutor: Create Course
========================= */
export const createCourse = async (req, res) => {
  try {
    let courseData = req.body;

    // If data is sent via FormData as a string
    if (typeof req.body.courseData === "string") {
      courseData = JSON.parse(req.body.courseData);
    }

    const {
      title,
      subtitle,
      description,
      category,
      level,
      price,
      language,
      chapters,
    } = courseData;

    let { status } = courseData;

    // Detect status from endpoint
    if (req.path.includes("save-draft")) status = "draft";
    if (req.path.includes("publish")) status = "published";

    let { thumbnail } = courseData;

    // Map uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "thumbnail") {
          thumbnail = `/uploads/${file.filename}`;
        } else if (file.fieldname.startsWith("video-")) {
          const lessonId = file.fieldname.replace("video-", "");
          // Find the lesson in chapters and update videoUrl
          chapters.forEach((chapter) => {
            chapter.lessons.forEach((lesson) => {
              if (
                lesson.id === lessonId ||
                lesson._id?.toString() === lessonId
              ) {
                lesson.videoUrl = `/uploads/${file.filename}`;
              }
            });
          });
        }
      });
    }

    // Conditional Validation
    if (status === "published") {
      if (!title || !description || !category || !subtitle) {
        return res.status(400).json({
          message:
            "Title, subtitle, description, and category are required to publish.",
        });
      }
      if (!chapters || chapters.length === 0) {
        return res.status(400).json({
          message: "At least one chapter is required to publish.",
        });
      }
    } else {
      // Draft requirements
      if (!title) {
        return res.status(400).json({
          message: "Title is required to save a draft.",
        });
      }
    }

    const course = await Course.create({
      title,
      subtitle,
      description,
      category,
      level,
      price: Number(price),
      language,
      thumbnail,
      chapters,
      status: status || "draft",
      tutor: req.user._id,
    });

    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({
      message: "Failed to create course",
      error: error.message,
    });
  }
};

/* =========================
   Tutor: Get My Created Courses
========================= */
export const getTutorCourses = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { status } = req.query; // Filter by ?status=draft or ?status=published

    const query = { tutor: tutorId };
    if (status) {
      query.status = status;
    }

    const courses = await Course.find(query);
    res.status(200).json({ courses });
  } catch (error) {
    console.error("GET TUTOR COURSES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch tutor courses" });
  }
};

/* =========================
   Tutor: Update Course (Save Draft / Publish)
========================= */
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    let course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.tutor.toString() !== tutorId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this course" });
    }

    let updateData = req.body;
    if (typeof req.body.courseData === "string") {
      updateData = JSON.parse(req.body.courseData);
    }

    // Detect status from endpoint
    if (req.path.includes("save-draft")) updateData.status = "draft";
    if (req.path.includes("publish")) updateData.status = "published";

    // Handle uploaded files similarly to create
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "thumbnail") {
          updateData.thumbnail = `/uploads/${file.filename}`;
        } else if (file.fieldname.startsWith("video-")) {
          const lessonId = file.fieldname.replace("video-", "");
          if (updateData.chapters) {
            updateData.chapters.forEach((chapter) => {
              chapter.lessons.forEach((lesson) => {
                if (
                  lesson.id === lessonId ||
                  lesson._id?.toString() === lessonId
                ) {
                  lesson.videoUrl = `/uploads/${file.filename}`;
                }
              });
            });
          }
        }
      });
    }

    // Conditional Validation for Update
    const currentStatus = updateData.status || course.status;
    if (currentStatus === "published") {
      const { title, description, category, subtitle, chapters } = {
        ...course.toObject(),
        ...updateData,
      };

      if (!title || !description || !category || !subtitle) {
        return res.status(400).json({
          message:
            "Title, subtitle, description, and category are required for published courses.",
        });
      }
      if (!chapters || chapters.length === 0) {
        return res.status(400).json({
          message: "At least one chapter is required to publish.",
        });
      }
    } else {
      // Draft update requirement
      const { title } = {
        ...course.toObject(),
        ...updateData,
      };
      if (!title) {
        return res.status(400).json({
          message: "Title is required to save a draft.",
        });
      }
    }

    course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);
    res
      .status(500)
      .json({ message: "Failed to update course", error: error.message });
  }
};

/* =========================
   General: Get Course By ID 
========================= */
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate("tutor", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ course });
  } catch (error) {
    console.error("GET COURSE BY ID ERROR:", error);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
};
