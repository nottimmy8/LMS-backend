import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import mongoose from "mongoose";

// Get Tutor Analytics (Earnings)
export const getTutorAnalytics = async (req, res) => {
  try {
    const tutorId = req.user._id;

    // 1. Get all courses by this tutor
    const courses = await Course.find({ instructor: tutorId }).select(
      "_id title price",
    );
    const courseIds = courses.map((c) => c._id);

    // 2. Get enrollments for these courses
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      paymentStatus: "completed",
    });

    // 3. Calculate total revenue
    const totalRevenue = enrollments.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // 4. Calculate revenue by course
    const revenueByCourse = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.course.toString() === course._id.toString(),
      );
      const revenue = courseEnrollments.reduce((sum, e) => sum + e.amount, 0);
      return {
        _id: course._id,
        title: course.title,
        revenue,
        enrollmentCount: courseEnrollments.length,
      };
    });

    res.status(200).json({
      totalRevenue,
      totalEnrollments: enrollments.length,
      revenueByCourse,
      // Mock data for balance pending real payment gateway integration
      availableBalance: totalRevenue * 0.9, // Assuming 10% platform fee
      pendingClearance: totalRevenue * 0.1,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching analytics", error: error.message });
  }
};

// Get Student Certificates
export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate("course", "title thumbnail")
      .sort({ createdAt: -1 });

    res.status(200).json(certificates);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching certificates", error: error.message });
  }
};

// Get Student Analytics (Dashboard Stats)
export const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total Enrolled Courses
    const totalEnrolled = await Enrollment.countDocuments({
      student: userId,
      paymentStatus: "completed",
    });

    // 2. Completed Courses
    const completedCourses = await Progress.countDocuments({
      student: userId,
      completedAt: { $exists: true },
    });

    // 3. Total Lessons Completed
    const progressList = await Progress.find({ student: userId });
    const totalLessonsCompleted = progressList.reduce(
      (sum, p) => sum + (p.completedLessons?.length || 0),
      0,
    );

    // 4. Certificates Earned
    const totalCertificates = await Certificate.countDocuments({
      student: userId,
    });

    res.status(200).json({
      totalEnrolled,
      completedCourses,
      totalLessonsCompleted,
      totalCertificates,
      streak: 0, // Mock for now, would requiring a "DailyLog" model
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching student analytics",
      error: error.message,
    });
  }
};

// Get Popular Course Categories (Top 5 by enrollment count)
export const getPopularCourseCategories = async (req, res) => {
  try {
    const categories = await Enrollment.aggregate([
      // Only count completed enrollments
      { $match: { paymentStatus: "completed" } },
      // Join with the Course collection to get the category
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      // Group by category and count enrollments
      {
        $group: {
          _id: "$courseInfo.category",
          enrollments: { $sum: 1 },
        },
      },
      // Sort by enrollment count descending
      { $sort: { enrollments: -1 } },
      // Take top 5
      { $limit: 5 },
      // Reshape for the frontend
      {
        $project: {
          _id: 0,
          category: "$_id",
          enrollments: 1,
        },
      },
    ]);

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching popular categories",
      error: error.message,
    });
  }
};

// Get Earnings Analytics (Monthly breakdown for a tutor)
export const getEarningsAnalytics = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Get all courses by this tutor
    const tutorCourses = await Course.find({ tutor: tutorId }).select("_id");
    const courseIds = tutorCourses.map((c) => c._id);

    // Aggregate monthly earnings from enrollments
    const monthlyData = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          paymentStatus: "completed",
          enrolledAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$enrolledAt" } },
          earnings: { $sum: "$amount" },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Build a full 12-month array, filling in zeros for months with no data
    const data = monthNames.map((name, index) => {
      const found = monthlyData.find((m) => m._id.month === index + 1);
      return {
        month: name,
        earnings: found ? found.earnings : 0,
        enrollments: found ? found.enrollments : 0,
      };
    });

    res.status(200).json({ year, data });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching earnings analytics",
      error: error.message,
    });
  }
};
