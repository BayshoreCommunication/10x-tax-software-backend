const nodemailer = require("nodemailer");
const { smptUser, smptPassword } = require("../secret");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: smptUser,
    pass: smptPassword,
  },
});

const sendProposalEmail = async (emailData, attachments) => {
  try {
    const emailOption = {
      from: smptUser,
      to: emailData.email,
      subject: emailData.subject,
      text: emailData.text,
      attachments: [
        {
          filename: attachments.originalname,
          path: attachments.path,
        },
      ],
    };

    const info = await transporter.sendMail(emailOption);
    console.log("Email message sent:", info.response);
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

module.exports = sendProposalEmail;
