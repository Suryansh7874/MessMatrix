import nodemailer from "nodemailer";

function getTransporter() {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing email configuration: ${key}`);
    }
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your Mess Matrix password",
    text: [
      "We received a request to set or reset your Mess Matrix password.",
      "",
      `Open this link to continue: ${resetUrl}`,
      "",
      "This link expires in 10 minutes.",
      "If you did not request this, you can ignore this email."
    ].join("\n")
  });
}