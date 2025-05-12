const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const { stripeSecretKey, stripeWebhookSecret } = require("../secret");
const Stripe = require("stripe");
const alertEmailSender = require("../helper/alertEmailSender");
const bodyParser = require("body-parser");
const stripe = new Stripe(stripeSecretKey);

// Old subscription payment Inten

const subscriptionPayment = async (req, res, next) => {
  const { amount, currency, customerDetails, paymentMethodType } = req.body;

  try {
    if (!amount || !currency) {
      throw createError(400, "Amount and currency are required.");
    }

    const paymentMethodTypes = paymentMethodType || ["us_bank_account"];

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: paymentMethodTypes,
      description: "Payment for subscription",
      receipt_email: customerDetails.email,
      metadata: {
        name: customerDetails.name,
        phone: customerDetails.phone,
      },
      shipping: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: {
          city: customerDetails.address.city,
          country: customerDetails.address.country,
        },
      },
    });

    if (!paymentIntent.client_secret) {
      throw createError(
        500,
        "Failed to create payment intent: No client secret."
      );
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Payment intent created successfully",
      payload: { clientSecret: paymentIntent.client_secret },
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    next(createError(500, error.message || "Failed to create payment intent."));
  }
};

// Old confrim subscription

const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const { paymentInfo, subscriptionInfo } = req.body;

    if (!paymentInfo || !subscriptionInfo) {
      throw createError(
        400,
        "Payment and subscription information are required."
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found.");
    }

    const subscription = new Subscription({
      userId,
      paymentInfo,
      subscriptionInfo,
    });

    await subscription.save();

    user.subscription = true;
    user.isAutoSubscription = true;
    user.currentSubscriptionPayDate = subscriptionInfo.subscriptionDate;
    user.currentSubscriptionExpiredDate =
      subscriptionInfo.subscriptionExpiredDate;
    user.currentSubscriptionType = subscriptionInfo.type;

    await user.save();

    const emailData = {
      email: userEmail,
      subject: "This is 10x Tax Subscription Confirm Emaill",
      text: "Your subscription will continue without interruption. Thank you for being a valued subscriber.",
    };

    await alertEmailSender(emailData);

    return successResponse(res, {
      statusCode: 201,
      message: "Subscription created successfully",
      payload: { subscription },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create subscription."));
  }
};

// Retrieves subscription data for a user by user ID.

const getSubscriptionByUserId = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return next(createError(404, "User not found."));
    }

    const search = req.query.search?.trim() || "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 5);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegExp = new RegExp(escapeRegExp(search), "i");

    const filter = { userId };

    if (search) {
      filter.$or = [{ "subscriptionInfo.type": searchRegExp }];
    }

    const totalSubscription = await Subscription.countDocuments(filter);

    if (totalSubscription === 0) {
      return successResponse(res, {
        statusCode: 200,
        message: "No subscription found matching the search criteria.",
        payload: {
          clients: [],
          pagination: {
            totalPages: 0,
            currentPage: 0,
            previousPage: null,
            nextPage: null,
          },
        },
      });
    }

    const subscription = await Subscription.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 })
      .exec();

    const totalPages = Math.ceil(totalSubscription / limit);

    return successResponse(res, {
      statusCode: 200,
      message: "Subscription details successfully returned.",
      payload: {
        subscription,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    next(
      createError(500, error.message || "Failed to retrieve client details.")
    );
  }
};

//Get subscription data by user id

const getSubscriptionByUserIdsd = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found."));
    }

    const search = req.query.search || "";
    const selectFilterOption = req.query.selectFilterOption || "All";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 5);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);

    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      $or: [
        { subscriptionDate: searchRegExp },
        { subscriptionExpiredDate: searchRegExp },
        { type: searchRegExp },
      ],
      userId,
    };

    if (selectFilterOption === "Month") {
      filter["subscriptionInfo.type"] = "Month";
    } else if (selectFilterOption === "Year") {
      filter["subscriptionInfo.type"] = "Year";
    }

    const subscriptions = await Subscription.find(filter)
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Subscription.countDocuments(filter);

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      statusCode: 200,
      message: "Subscription data retrieved successfully",
      payload: {
        subscriptions,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return next(createError(400, "Invalid ID format"));
    }
    next(
      createError(500, error.message || "Failed to retrieve subscription data.")
    );
  }
};

// Old cancle user auto subscription

const isAutoSubscriptionCancel = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw createError(401, "Unauthorized access.");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found.");
    }

    if (!user.isAutoSubscription) {
      throw createError(400, "Auto subscription is already canceled.");
    }

    const subscriptions = await Subscription.find({ userId: user._id });

    if (!subscriptions.length) {
      throw createError(404, "Subscription info not found.");
    }

    const paymentId = subscriptions[0]?.paymentInfo?.paymentId;

    if (!paymentId) {
      throw createError(404, "Payment ID not found for subscription.");
    }

    await stripe.subscriptions.update(paymentId, {
      cancel_at_period_end: true,
    });

    user.isAutoSubscription = false;
    await user.save();

    const emailData = {
      email: user.email,
      subject: "10x Tax Subscription Cancellation",
      text: "Your auto subscription has been canceled.",
    };

    await alertEmailSender(emailData);

    return successResponse(res, {
      statusCode: 200,
      message: "Auto subscription canceled successfully.",
      payload: { isAutoSubscription: user.isAutoSubscription },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to cancel subscription."));
  }
};

//  Create  checkout session for subscription

const createCheckoutSession = async (req, res, next) => {
  const { priceId } = req.body;
  const userId = req.user._id;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "us_bank_account"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: "https://10x-tax-software-user.vercel.app/payment-success",
      cancel_url: "https://10x-tax-software-user.vercel.app/payment-failed",

      // success_url: "http://localhost:3000/payment-success",
      // cancel_url: "http://localhost:3000/payment-failed",

      subscription_data: {
        metadata: {
          userId: userId.toString(),
        },
      },
    });

    return res.status(200).json({
      message: "Checkout session created successfully.",
      payload: { sessionId: session.id },
    });
  } catch (error) {
    next(new Error(error.message || "Failed to create checkout session."));
  }
};

// Stripe Webhook for subscriptin manage

const webhookController = async (req, res) => {
  let event = req.body;

  if (stripeWebhookSecret) {
    const signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const subscription = event.data.object;
      const userId = subscription?.subscription_details?.metadata?.userId;

      const subscriptionDetails = await stripe.subscriptions.retrieve(
        subscription?.subscription
      );

      const user = await User.findById(userId);

      if (user) {
        user.subscription = true;
        user.isAutoSubscription = true;
        user.currentSubscriptionPayDate = new Date(subscription.created * 1000);
        user.currentSubscriptionExpiredDate = new Date(
          subscriptionDetails.current_period_end * 1000
        );
        user.currentSubscriptionType = subscriptionDetails?.plan?.interval;

        await user.save();

        const paymentInfo = {
          email: subscription?.customer_email || "",
          name: subscription?.customer_name || "none",
          country: subscription?.customer_address?.country || "",
          paymentId: subscription?.subscription || "",
        };

        const subscriptionInfo = {
          subscriptionDate: new Date(subscriptionDetails.created * 1000),
          subscriptionExpiredDate: new Date(
            subscriptionDetails?.current_period_end * 1000
          ),
          type: subscriptionDetails?.plan?.interval,
        };

        const newSubscription = new Subscription({
          userId,
          paymentInfo: paymentInfo,
          subscriptionInfo: subscriptionInfo,
        });

        await newSubscription.save();

        const emailData = {
          email: user.email,
          subject: "This is 10x Tax Subscription Confirm Emaill",
          text: "Your subscription will continue without interruption. Thank you for being a valued subscriber.",
          html: `
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
            <div style="max-width: 720px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <div style="padding: 30px; text-align: left;">
                <h1 style="font-size: 24px; color: #2e7d32; margin-bottom: 20px;">Hello ${
                  user.businessName
                },</h1>
        
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
                  We're excited to confirm that your <strong>10x Tax subscription</strong> has been successfully activated! 🎉
                </p>
        
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
                  Your subscription will provide you with access to all the features and services until <strong>${
                    subscriptionDetails?.current_period_end * 1000
                  }</strong>.
                </p>
        
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
                  If you have any questions, need assistance, or want to make changes to your subscription, please <a href="https://10x-tax-software-user.vercel.app/support" style="color: #007BFF; text-decoration: underline;">contact us</a>.
                </p>
        
                <p style="font-size: 16px; color: #333333; margin-top: 30px;">
                  Thank you for choosing 10x Tax! We're here to help you manage your tax services efficiently.
                </p>
        
                <p style="font-size: 16px; color: #333333; margin-top: 30px;">
                  Best regards,<br/>
                  The 10x Tax Team
                </p>
              </div>
        
              <div style="text-align: center; font-size: 12px; color: #888888; background-color: #f0f0f0; padding: 12px;">
                This email is intended for ${
                  user.fullName
                }. If you believe you've received this email in error, please <a href="https://10x-tax-software-user.vercel.app/contact-us" style="color: #007BFF; text-decoration: underline;">contact our support team</a>.
              </div>
            </div>
          </body>
        `,
        };

        await alertEmailSender(emailData);

        console.log("User subscription updated successfully.");
      } else {
        console.log("User not found for this subscription.");
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      const user = await User.findById(userId);

      if (user) {
        user.subscription = false;
        user.isAutoSubscription = false;
        user.currentSubscriptionExpiredDate = null;
        user.currentSubscriptionPayDate = null;
        user.currentSubscriptionType = null;

        await user.save();

        const emailData = {
          email: user.email,
          subject: "This is 10x Tax Subscription Cancel Emaill",
          text: "Your subscription cancel.",
          html: `
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
            <div style="max-width: 720px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <div style="padding: 30px; text-align: left;">
                <h1 style="font-size: 24px; color: #e53935; margin-bottom: 20px;">Hi ${user.businessName},</h1>
  
        
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
                  If this was a mistake or you'd like to reactivate your subscription, please <a href="https://10x-tax-software-user.vercel.app/subscription" style="color: #007BFF; text-decoration: underline;">click here</a> or contact our support team.
                </p>
        
                <p style="font-size: 16px; color: #333333; margin-top: 30px;">
                  We appreciate your time with us and hope to serve you again in the future.
                </p>
        
                <p style="font-size: 16px; color: #333333; margin-top: 30px;">
                  Best regards,<br/>
                  The 10x Tax Team
                </p>
              </div>
        
              <div style="text-align: center; font-size: 12px; color: #888888; background-color: #f0f0f0; padding: 12px;">
                This email is intended for ${user.businessName}. If you did not request to cancel your subscription, please contact support immediately.
              </div>
            </div>
          </body>
        `,
        };

        await alertEmailSender(emailData);

        console.log("User subscription canceled successfully.");
      } else {
        console.log("User not found for this subscription.");
      }
      break;
    }

    case "invoice.payment_failed": {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      const user = await User.findById(userId);
      if (user) {
        user.subscription = false;
        user.isAutoSubscription = false;
        user.currentSubscriptionExpiredDate = null;
        user.currentSubscriptionPayDate = null;
        user.currentSubscriptionType = null;

        await user.save();

        console.log(
          "User subscription marked as inactive due to payment failure."
        );
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};

// // Testing code start from

// // Create Vendor

// const createVendor = async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     console.log("check email", email);

//     const account = await stripe.accounts.create({
//       type: "express",
//       country: "BD",
//       email,
//       capabilities: {
//         card_payments: { requested: true }, // Required for accepting card payments
//         transfers: { requested: true }, // Required for sending money to vendors
//       },
//     });

//     console.log("check this image value", account, account.id);

//     res.json({ accountId: account.id });

//   } catch (error) {
//     console.error("Error creating vendor:", error);

//     res.status(500).json({ error: error.message });
//   }
// }

// // Create payment instance for test  create-payment-intent

// const createPaymentIntentstest =  async (req, res, next) => {
//   try {
//     const { amount } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Invalid amount provided." });
//     }

//     // Calculate split (90% to boat owner, 10% to site owner)
//     const boatOwnerAmount = Math.round(amount * 0.9);
//     const siteOwnerAmount = Math.round(amount * 0.1);

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: { name: "Boat Rental" },
//             unit_amount: amount,
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: "http://localhost:3001/success?session_id={CHECKOUT_SESSION_ID}",
//       cancel_url: "http://localhost:3001/cancel",
//     });

//     return res.status(200).json({
//       message: "Checkout session created successfully.",
//       payload: { sessionId: session.id },
//     });
//   } catch (error) {
//     next(new Error(error.message || "Failed to create checkout session."));
//   }
// }

// // Confirm Payment

// const confirmPayment = async (req, res, next) => {
//   let event = req.body;

//   if (stripeWebhookSecret) {
//     const signature = req.headers['stripe-signature'];

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         signature,
//         stripeWebhookSecret
//       );
//     } catch (err) {
//       console.log(`⚠️  Webhook signature verification failed.`, err.message);
//       return response.sendStatus(400);
//     }
//   }

//     if (event.type === "payment_intent.succeeded") {
//       const paymentIntent = event.data.object;
//       console.log("Payment successful:", paymentIntent.id);
//       // Update order status in DB
//     }

//     res.send();
// }

module.exports = {
  subscriptionPayment,
  createSubscription,
  getSubscriptionByUserId,
  isAutoSubscriptionCancel,
  createCheckoutSession,
  webhookController,
};
