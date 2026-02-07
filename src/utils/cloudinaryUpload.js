import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";

/**
 * Upload a file to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload an image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Folder name (optional, defaults to 'lms/thumbnails')
 * @returns {Promise<string>} - Secure URL of the uploaded image
 */
export const uploadImage = async (buffer, folder = "lms/thumbnails") => {
  const result = await uploadToCloudinary(buffer, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
};

/**
 * Upload a video to Cloudinary
 * @param {Buffer} buffer - Video buffer
 * @param {string} folder - Folder name (optional, defaults to 'lms/videos')
 * @returns {Promise<string>} - Secure URL of the uploaded video
 */
export const uploadVideo = async (buffer, folder = "lms/videos") => {
  const result = await uploadToCloudinary(buffer, {
    folder,
    resource_type: "video",
    chunk_size: 6000000, // 6MB chunks for large files
  });
  return result.secure_url;
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - 'image' or 'video' (default: 'image')
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not a Cloudinary URL
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const publicId = filename.split(".")[0];
  // Start from the folder name if present (e.g., lms/thumbnails/filename)
  // This is a simplified extraction and might need adjustment based on full path structure
  // A robust way often involves regex or parsing the path after 'upload/' version
  const uploadIndex = parts.findIndex(
    (part) => part === "upload" || part.startsWith("v"),
  );
  if (uploadIndex !== -1) {
    return parts
      .slice(uploadIndex + 2)
      .join("/")
      .split(".")[0];
  }
  return publicId;
};
