import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const SendForgotPasswordMail = async ({
  otp,
  to,
}: {
  otp: number;
  to: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: "smtp.gmail.com",
    port: 465, // default is 587
    secure: true, // default is false but for 465 it's true.
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: {
      name: "Invoice Generator",
      address: process.env.SMTP_USER || "",
    },
    to: to,
    subject: "Forgot Password Otp",
    html: `<p>Your otp for forgot password is <b>${otp}</b> please submit it.</p> `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error(error);
    return false;
  }
};

export { SendForgotPasswordMail };
