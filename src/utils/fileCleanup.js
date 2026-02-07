import fs from "fs";
import path from "path";
import {
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "./cloudinaryUpload.js";

/**
 * Safely delete a file (local or Cloudinary)
 * @param {string} filePath - URL or relative path
 */
export const deleteFile = async (filePath) => {
  if (!filePath) return;

  // Handle Cloudinary URLs
  if (filePath.includes("cloudinary.com")) {
    const publicId = getPublicIdFromUrl(filePath);
    if (publicId) {
      const resourceType = filePath.includes("/video/") ? "video" : "image";
      try {
        await deleteFromCloudinary(publicId, resourceType);
        console.log(`✓ Deleted from Cloudinary: ${publicId}`);
      } catch (error) {
        console.error(
          `✗ Failed to delete from Cloudinary: ${publicId}`,
          error.message,
        );
      }
    }
    return;
  }

  // Handle Local Files (Legacy support)
  // Normalize the path - remove leading slash if present
  const normalizedPath = filePath.startsWith("/")
    ? filePath.slice(1)
    : filePath;
  const fullPath = path.join(process.cwd(), normalizedPath);
  const uploadsDir = path.join(process.cwd(), "uploads");

  // Security: Only delete files from uploads directory (if local)
  if (fullPath.startsWith(uploadsDir)) {
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      await fs.promises.unlink(fullPath);
      console.log(`✓ Deleted local file: ${filePath}`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          `✗ Failed to delete local file: ${filePath}`,
          error.message,
        );
      }
    }
  }
};

/**
 * Delete multiple files
 * @param {string[]} filePaths - Array of file paths to delete
 */
export const deleteFiles = async (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) return;

  const validPaths = filePaths.filter(Boolean);
  await Promise.all(validPaths.map(deleteFile));
};

/**
 * Collect all video URLs from course chapters
 * @param {Array} chapters - Course chapters array
 * @returns {string[]} Array of video URLs
 */
export const collectVideoUrls = (chapters) => {
  if (!chapters || !Array.isArray(chapters)) return [];

  const videoUrls = [];
  for (const chapter of chapters) {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      for (const lesson of chapter.lessons) {
        if (lesson.videoUrl) {
          videoUrls.push(lesson.videoUrl);
        }
      }
    }
  }
  return videoUrls;
};

/**
 * Clean up all files associated with a course (thumbnail + videos)
 * @param {Object} course - Course document
 */
export const cleanupCourseFiles = async (course) => {
  const filesToDelete = [];

  if (course.thumbnail) {
    filesToDelete.push(course.thumbnail);
  }

  const videoUrls = collectVideoUrls(course.chapters);
  filesToDelete.push(...videoUrls);

  if (filesToDelete.length > 0) {
    console.log(
      `Cleaning up ${filesToDelete.length} files for course: ${course.title}`,
    );
    await deleteFiles(filesToDelete);
  }
};
