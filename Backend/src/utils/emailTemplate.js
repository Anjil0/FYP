const Verification_Email_Template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 30px auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              border: 1px solid #ddd;
          }
          .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 26px;
              font-weight: bold;
          }
          .content {
              padding: 25px;
              color: #333;
              line-height: 1.8;
          }
          .verification-code {
              display: block;
              margin: 20px 0;
              font-size: 22px;
              color: #4CAF50;
              background: #e8f5e9;
              border: 1px dashed #4CAF50;
              padding: 10px;
              text-align: center;
              border-radius: 5px;
              font-weight: bold;
              letter-spacing: 2px;
          }
          .footer {
              background-color: #f4f4f4;
              padding: 15px;
              text-align: center;
              color: #777;
              font-size: 12px;
              border-top: 1px solid #ddd;
          }
          p {
              margin: 0 0 15px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">Verify Your Email</div>
          <div class="content">
              <p>Hello,</p>
              <p>Thank you for signing up! Please confirm your email address by entering the code below:</p>
              <span class="verification-code">{verificationCode}</span>
              <p>If you did not create an account, no further action is required. If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} @TutorEase. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
`;

const forgotPasswordTemplate = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset Request</title>
        <style>
          /* Styles as above */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TutorEase</h1>
          </div>
          <div class="body">
            <p class="message">
              Hello, <br />
              We received a request to reset the password for your TutorEase account. If you did not request a password reset, please ignore this email.
            </p>
            <p class="message">
              To reset your password, please click the button below:
            </p>
            <a href="{resetUrl}" class="cta-button">Reset Your Password</a>
          </div>
          <div class="footer">
            <p>If you have any issues, feel free to contact our support team.</p>
            <p>Thank you for using TutorEase!</p>
          </div>
        </div>
      </body>
    </html>
  `;

const tutorApprovalTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="text-align: center; color: #4CAF50;">Congratulations, {tutorName}!</h2>
          <p style="text-align: center;">Your profile has been successfully verified on <strong>TutorEase</strong>.</p>
          <p style="text-align: center;">We are excited to have you join our community of educators. You can now start offering your tutoring services to students.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.tutorease.com" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px;">Go to TutorEase</a>
          </div>
          <p style="text-align: center; margin-top: 30px;">Thank you for being a part of TutorEase.</p>
          <p style="text-align: center;">Best Regards,<br>TutorEase Team</p>
        </div>
      `;

const tutorRejectionTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #F44336;">Hello, {tutorName}</h2>
        <p style="text-align: center;">We regret to inform you that your profile verification on <strong>TutorEase</strong> was not successful.</p>
        <p style="text-align: center;">After reviewing your application, we found that the provided certification did not meet our requirements.</p>
        <p style="text-align: center;">To ensure the highest quality of tutoring services, we require all tutors to have valid and verifiable certifications.</p>
        <p style="text-align: center;">Please review your certificates and upload the correct certification documents. You are welcome to reapply on <strong>TutorEase</strong> after making the necessary updates.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.tutorease.com" style="display: inline-block; padding: 10px 20px; background-color: #F44336; color: #ffffff; text-decoration: none; border-radius: 5px;">Go to TutorEase</a>
        </div>
        <p style="text-align: center; margin-top: 30px;">If you have any questions or need assistance, feel free to contact our support team.</p>
        <p style="text-align: center;">We look forward to your successful reapplication.</p>
        <p style="text-align: center;">Best Regards,<br>TutorEase Team</p>
      </div>
    `;

module.exports = {
  Verification_Email_Template,
  forgotPasswordTemplate,
  tutorRejectionTemplate,
  tutorApprovalTemplate,
};
