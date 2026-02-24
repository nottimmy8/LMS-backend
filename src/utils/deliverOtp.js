import sendEmail from "./sendEmail.js";

const deliverOtp = async ({ email, otp, purpose }) => {
  const deliveryMethod = (process.env.OTP_DELIVERY || "console")
    .trim()
    .toLowerCase();

  if (deliveryMethod === "console") {
    console.log(`\n===== OTP (${purpose}) =====`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log("===========================\n");
    return;
  }

  // EMAIL MODE - Run asynchronously without awaiting
  sendEmail({
    to: email,
    subject: "Your OTP Code",
    html: `
      <h2>${purpose}</h2>
      <p>Your OTP is <b>${otp}</b></p>
      <p>This code expires in 10 minutes.</p>
    `,
  }).catch((error) => {
    console.error(`FAILED TO DELIVER OTP (${purpose}) to ${email}:`, error);
  });
};

export default deliverOtp;
