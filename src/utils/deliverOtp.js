import sendEmail from "./sendEmail.js";

const deliverOtp = async ({ email, otp, purpose }) => {
  if (process.env.OTP_DELIVERY === "console") {
    console.log(`\n===== OTP (${purpose}) =====`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log("===========================\n");
    return;
  }

  // EMAIL MODE (future)
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    html: `
      <h2>${purpose}</h2>
      <p>Your OTP is <b>${otp}</b></p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};

export default deliverOtp;
