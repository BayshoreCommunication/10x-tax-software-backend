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
      html: `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
        <div style="max-width: 720px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <div style="padding: 30px; text-align: left;">
            <h1 style="font-size: 24px; color: #333333; margin-bottom: 20px;">Hello ${emailData?.clientName},</h1>
            
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              We are pleased to share with you your personalized <strong>Tax Proposal</strong>. It includes details tailored to your business or individual profile, outlining the suggested services and estimated costs.
            </p>
            
            <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
              If you have any questions, feedback, or need changes, please feel free to contact us. We’re here to help you every step of the way.
            </p>
            
            <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
              Thank you for choosing our services.
            </p>
    
            <p style="font-size: 16px; color: #333333; margin-top: 30px;">
              Best regards,<br/>
              The 10x Tax Team
            </p>
          </div>
    
          <div style="text-align: center; font-size: 12px; color: #888888; background-color: #f0f0f0; padding: 12px;">
            This proposal email is confidential and intended solely for ${emailData?.clientName}. If you received it in error, please disregard or contact our support.
          </div>
        </div>
      </body>
    `,
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
