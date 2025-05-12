// cron/reminderCheck.js
const cron = require("node-cron");
const User = require("../models/userModel");
const sendReminder = require("../utils/sendReminder");
const sendEmailWithNodeMailer = require("../helper/email");

const sendVerificationEmail = async (email, diffInDays, businessName) => {
  const emailData = {
    email,
    subject: "Your 10x Tax Subscription Expires Soon",
    html: `
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          
          <div style="background-color: #0D0D0D; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">Subscription Reminder</h1>
          </div>
          
          <div style="padding: 30px; text-align: center;">
            <h2 style="color: #333333;">Hello ${businessName},</h2>
            <p style="color: #555555; font-size: 16px; line-height: 1.6;">
              This is a friendly reminder that your <strong>10x Tax subscription</strong> will expire in 
              <strong>${
                diffInDays === 1 ? "1 day" : `${diffInDays} days`
              }</strong>.
            </p>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.6;">
              To avoid any interruption in service, please renew your subscription before it expires.
            </p>
            
            <a href="https://your-website.com/renew-subscription" target="_blank" style="
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background-color: #007BFF;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              font-size: 16px;
            ">
              Renew Now
            </a>
          </div>
          
          <div style="padding: 20px; text-align: center; font-size: 12px; color: #999999;">
            If you’ve already renewed your subscription, you can safely ignore this email.
          </div>
        </div>
      </body>
    `,
  };

  try {
    await sendEmailWithNodeMailer(emailData);
  } catch (error) {
    throw new Error("Failed to send verification email");
  }
};

cron.schedule("0 9 * * *", async () => {
  const now = new Date();

  const users = await User.find({
    currentSubscriptionPayDate: { $exists: true },
  });

  for (const user of users) {
    const diffInDays = Math.ceil(
      (user.currentSubscriptionPayDate - now) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 7 || diffInDays === 1) {
      // await sendReminder(user.email, diffInDays);
      await sendVerificationEmail(email, diffInDays, user.businessName);
    }
  }
});
