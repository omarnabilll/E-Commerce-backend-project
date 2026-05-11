require("dotenv").config();
const nodemailer = require("nodemailer");
let transporter;

const sendEmail = async ({ to, subject, message }) => {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "Ecommerce App <no-reply@ecommerce.com>",
    to,
    subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
