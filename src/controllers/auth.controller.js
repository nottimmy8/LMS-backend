import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import generateOtp from "../utils/generateOtp.js";
import crypto from "crypto";

/* =========================
   REGISTER (NO JWT HERE)
========================= */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const { hashedOtp, otp, expiresAt } = generateOtp();

    await User.create({
      name,
      email,
      password,
      role,
      otp: hashedOtp,
      otpExpiresAt: expiresAt,
      isVerified: false,
    });

    // OTP should be sent via email here (nodemailer)
    console.log("OTP (dev only):", otp);

    res.status(201).json({
      message: "Registration successful. Please verify your email with OTP.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

/* =========================
   VERIFY OTP (ACTIVATES ACCOUNT)
========================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email }).select("+otp +otpAttempts");

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    // Check OTP expiry
    if (!user.otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOtp !== user.otp) {
      user.otpAttempts += 1;

      // Lock user if too many failed attempts
      if (user.otpAttempts >= 5) {
        await user.save();
        return res
          .status(429)
          .json({ message: "Too many failed OTP attempts. Try again later." });
      }

      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Successful verification
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0; // reset counter
    await user.save();

    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* =========================
   RESEND OTP
========================= */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).select("+otp +otpAttempts");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    // Limit OTP resends to 5 attempts
    if (user.otpAttempts >= 5) {
      return res
        .status(429)
        .json({ message: "Maximum OTP attempts reached. Try later." });
    }

    // Generate new OTP
    const { otp, hashedOtp, expiresAt } = generateOtp();

    user.otp = hashedOtp;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts += 1;
    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: ${otp}</h2><p>Expires in 10 minutes</p>`,
    });

    // generate otp on console
    console.log("OTP for testing:", otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);
    res.status(500).json({ message: "Could not resend OTP" });
  }
};

/* =========================
   LOGIN (VERIFIED USERS ONLY)
========================= */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });

  if (!user.isVerified)
    return res.status(403).json({ message: "Verify your email first" });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
    },
  });
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security best practice: do not reveal user existence
      return res.status(200).json({
        message: "If the email exists, an OTP has been sent",
      });
    }

    const { otp, hashedOtp, expiresAt } = generateOtp();

    user.resetOtp = hashedOtp;
    user.resetOtpExpiresAt = expiresAt;
    user.resetOtpAttempts = 0;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP is <b>${otp}</b></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
    // generate otp on console
    console.log("OTP for testing:", otp);

    res.status(200).json({
      message: "If the email exists, an OTP has been sent",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email }).select(
      "+resetOtp +resetOtpAttempts",
    );

    if (!user || !user.resetOtp || user.resetOtpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.resetOtpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many failed attempts. Try again later.",
      });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOtp !== user.resetOtp) {
      user.resetOtpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Password reset failed" });
  }
};

/* =========================
 REFRESH ACCESS TOKEN
========================= */
export const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return res.sendStatus(403);
    }

    const newAccessToken = generateAccessToken(user._id);

    res.json({ accessToken: newAccessToken });
  } catch {
    res.sendStatus(403);
  }
};

/* =========================
LOGOUT
========================= */
export const logout = async (req, res) => {
  try {
    // Clear refresh token from DB and cookie
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};
