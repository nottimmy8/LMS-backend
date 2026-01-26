import crypto from "crypto";

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  return {
    otp,
    hashedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
};

export default generateOtp;
