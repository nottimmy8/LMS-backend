import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);
console.log("EMAIL_PASS (chars):", JSON.stringify(process.env.EMAIL_PASS));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("\nVerifying transporter...");
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ TRANSPORTER VERIFY FAILED:", error.message);
    console.error("Full error:", error);
  } else {
    console.log("✅ Transporter verified! Sending test email...");
    transporter.sendMail(
      {
        from: `"LMS Test" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: "Test OTP Email",
        html: "<h2>Test Email</h2><p>Your OTP system is working!</p>",
      },
      (err, info) => {
        if (err) {
          console.error("❌ SEND FAILED:", err.message);
        } else {
          console.log("✅ Email sent!", info.response);
        }
      },
    );
  }
});
