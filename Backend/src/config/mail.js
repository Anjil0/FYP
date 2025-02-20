const config = require("./config");
const nodemailer = require("nodemailer");
const {
  Verification_Email_Template,
  forgotPasswordTemplate,
  tutorApprovalTemplate,
  tutorRejectionTemplate,
} = require("../utils/emailTemplate");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.gmailUser,
    pass: config.gmailPass,
  },
});

const sendVerificationMail = async (to, verificationCode) => {
  await transporter.sendMail({
    from: config.gmailUser,
    to,
    subject: "Verification Code for TutorEase",
    html: Verification_Email_Template.replace(
      "{verificationCode}",
      verificationCode
    ),
  });
};

const sendPasswordResetEmail = async (to, resetCode) => {
  const resetUrl = `http://localhost:5173/resetPass/${resetCode}`;
  await transporter.sendMail({
    from: config.gmailUser,
    to,
    subject: "Password Reset Request for TutorEase",
    html: forgotPasswordTemplate.replace("{resetUrl}", resetUrl),
  });
};

const sendTutorMailVerified = async (to, tutorName) => {
  await transporter.sendMail({
    from: config.gmailUser,
    to,
    subject: "Certificate Verification Successful - TutorEase",
    html: tutorApprovalTemplate.replace("{tutorName}", tutorName),
  });
};

const sendTutorVerificationReject = async (to, tutorName) => {
  await transporter.sendMail({
    from: config.gmailUser,
    to,
    subject: "Certificate Verification Unsuccessful - TutorEase",
    html: tutorRejectionTemplate.replace("{tutorName}", tutorName),
  });
};

module.exports = {
  sendVerificationMail,
  sendPasswordResetEmail,
  sendTutorMailVerified,
  sendTutorVerificationReject,
};
