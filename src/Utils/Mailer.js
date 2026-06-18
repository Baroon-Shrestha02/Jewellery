import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be set in environment variables",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return cachedTransporter;
};

export const sendOtpEmail = async (to, otp) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fafafa;">
      <div style="background: #ffffff; padding: 32px; border-radius: 16px; border-top: 4px solid #9b111e;">
        <h1 style="color: #9b111e; font-size: 20px; margin: 0 0 8px 0; letter-spacing: 0.1em; text-transform: uppercase;">Vaishno Jewellers</h1>
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 24px 0; letter-spacing: 0.2em; text-transform: uppercase;">Password Reset Request</p>

        <p style="color: #1f2937; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset your password. Use the verification code below to continue. This code expires in 10 minutes.
        </p>

        <div style="background: #fef3c7; border: 2px solid #f1c40f; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
          <p style="color: #92400e; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0 0 8px 0; font-weight: bold;">Your OTP</p>
          <p style="color: #1f2937; font-size: 36px; font-weight: 900; letter-spacing: 0.5em; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
        </div>

        <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0;">
          If you did not request a password reset, ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 10px; margin: 16px 0 0 0; letter-spacing: 0.1em;">
        © ${new Date().getFullYear()} Vaishno Jewellers
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Vaishno Jewellers" <${from}>`,
    to,
    subject: `Password Reset Code: ${otp}`,
    text: `Your Vaishno Jewellers password reset code is ${otp}. It expires in 10 minutes.`,
    html,
  });
};
