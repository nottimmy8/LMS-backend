import Course from "../models/Course.js";
import mongoose from "mongoose";

/* =========================
   Tutor: Get Dashboard Stats
   ========================= */
export const getTutorStats = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const stats = await Course.aggregate([
      { $match: { tutor: new mongoose.Types.ObjectId(tutorId) } },
      {
        $facet: {
          courseStats: [
            { $match: { status: "published" } },
            { $group: { _id: null, totalCourses: { $sum: 1 } } },
          ],
          studentStats: [
            {
              $unwind: { path: "$students", preserveNullAndEmptyArrays: false },
            }, // only count courses with students
            {
              $group: { _id: null, uniqueStudents: { $addToSet: "$students" } },
            },
            { $project: { totalStudents: { $size: "$uniqueStudents" } } },
          ],
          earningStats: [
            {
              $group: {
                _id: null,
                totalEarnings: {
                  $sum: {
                    $multiply: [
                      { $size: { $ifNull: ["$students", []] } },
                      { $ifNull: ["$price", 0] },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalCourses: { $arrayElemAt: ["$courseStats.totalCourses", 0] },
          totalStudents: { $arrayElemAt: ["$studentStats.totalStudents", 0] },
          totalEarnings: { $arrayElemAt: ["$earningStats.totalEarnings", 0] },
        },
      },
    ]);

    const result = {
      totalCourses: stats[0]?.totalCourses || 0,
      totalStudents: stats[0]?.totalStudents || 0,
      totalEarnings: stats[0]?.totalEarnings || 0,
    };

    res.status(200).json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("GET TUTOR STATS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor stats",
      error: error.message,
    });
  }
};

/* =========================
   Tutor: Get Recent Courses
   ========================= */
export const getRecentCourses = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const courses = await Course.find({ tutor: tutorId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title thumbnail price status students updatedAt");

    res.status(200).json({
      success: true,
      courses: courses.map((course) => ({
        ...course._doc,
        students: course.students ? course.students.length : 0,
        lastUpdated: course.updatedAt,
      })),
    });
  } catch (error) {
    console.error("GET RECENT COURSES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent courses",
      error: error.message,
    });
  }
};

/* =========================
   Tutor: Get Chart Data (Monthly earnings & enrollments)
   ========================= */
export const getTutorChartData = async (req, res) => {
  try {
    const tutorId = req.user._id;

    // This is a simplified proxy for chart data since we don't have separate Enrollment models.
    // It groups courses by created month and sums up their current student count/earnings performance.
    // A better approach would be to track enrollment dates, but for now, we'll return structured data
    // that the frontend can use to render a graph.

    const chartData = await Course.aggregate([
      { $match: { tutor: new mongoose.Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          enrollments: { $sum: { $size: { $ifNull: ["$students", []] } } },
          earnings: {
            $sum: {
              $multiply: [
                { $size: { $ifNull: ["$students", []] } },
                { $ifNull: ["$price", 0] },
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedData = chartData.map((item) => ({
      name: `${item._id.month}/${item._id.year}`,
      enrollments: item.enrollments,
      earnings: item.earnings,
    }));

    res.status(200).json({
      success: true,
      chartData: formattedData,
    });
  } catch (error) {
    console.error("GET CHART DATA ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
    });
  }
};
