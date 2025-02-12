const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const { stripeSecretKey, stripeWebhookSecret } = require("../secret");
const Stripe = require("stripe");
const alertEmailSender = require("../helper/alertEmailSender");
const bodyParser = require('body-parser');
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
      throw createError(500, "Failed to create payment intent: No client secret.");
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
      throw createError(400, "Payment and subscription information are required.");
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
    user.currentSubscriptionExpiredDate = subscriptionInfo.subscriptionExpiredDate;
    user.currentSubscriptionType = subscriptionInfo.type;

    await user.save();

    const emailData = {email: userEmail, subject: "This is 10x Tax Subscription Confirm Emaill", text: "Your subscription will continue without interruption. Thank you for being a valued subscriber."}
  
    await alertEmailSender(emailData)

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

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegExp = new RegExp(escapeRegExp(search), "i");

    const filter = { userId };

    if (search) {
      filter.$or = [
        { "subscriptionInfo.type": searchRegExp },
      ];
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
    next(createError(500, error.message || "Failed to retrieve client details."));
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
      createError(
        500,
        error.message || "Failed to retrieve subscription data."
      )
    );
  }
};


// Old cancle user auto subscription 

const isAutoSubscriptionCancel = async (req, res, next) => {
  try {

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, "User not found.");
    }

    if (!user.isAutoSubscription) {
      throw createError(404, "User already canceled auto subscription.");
    }

    user.isAutoSubscription = false;

    await user.save();

    const emailData = {email: user.email, subject: "This is 10x Tax Subscription Emaill", text: "Your auto subscription is cancel"}
  
    await alertEmailSender(emailData)

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
      mode: 'subscription',
      payment_method_types: ["card", "us_bank_account", "paypal"],
      line_items: [
        {
          price: priceId,  
          quantity: 1,
        },
      ],
      success_url: 'https://10x-tax-software-user.vercel.app/payment-success',  
      cancel_url: 'https://10x-tax-software-user.vercel.app/payment-failed',

      // success_url: 'http://localhost:3000/payment-success',  
      // cancel_url: 'http://localhost:3000/payment-failed',

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
    const signature = req.headers['stripe-signature'];

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
    case 'invoice.payment_succeeded': {
      const subscription = event.data.object;
      const userId = subscription?.subscription_details?.metadata?.userId;  

      const subscriptionDetails = await stripe.subscriptions.retrieve(subscription?.subscription);

      const user = await User.findById(userId);

      if (user) {
        user.subscription = true;
        user.isAutoSubscription = true;
        user.currentSubscriptionPayDate = new Date(subscription.created * 1000);  
        user.currentSubscriptionExpiredDate = new Date(subscriptionDetails.current_period_end * 1000);
        user.currentSubscriptionType = subscriptionDetails?.plan?.interval ;  

        await user.save();
      
        const paymentInfo = {
          email: subscription?.customer_email || "",
          name: subscription?.customer_name || "none",
          country: subscription?.customer_address?.country || "",
          paymentId: subscription?.subscription|| "",
        }
  
        const  subscriptionInfo = {
          subscriptionDate: new Date(subscriptionDetails.created * 1000),
          subscriptionExpiredDate: new Date(subscriptionDetails?.current_period_end * 1000),
          type: subscriptionDetails?.plan?.interval,
        }

        const newSubscription = new Subscription({
          userId,
          paymentInfo : paymentInfo,
          subscriptionInfo : subscriptionInfo
        });

        await newSubscription.save();

        const emailData = {email: user.email, subject: "This is 10x Tax Subscription Confirm Emaill", text: "Your subscription will continue without interruption. Thank you for being a valued subscriber."}
  
        await alertEmailSender(emailData)

        console.log('User subscription updated successfully.');
      } else {
        console.log('User not found for this subscription.');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      const user = await User.findById(userId);
      
      if (user) {
        user.subscription = false;
        user.isAutoSubscription = false;
        user.currentSubscriptionExpiredDate =null;
        user.currentSubscriptionPayDate=null;
        user.currentSubscriptionType = null;

        await user.save();

        
        const emailData = {email: user.email, subject: "This is 10x Tax Subscription Cancel Emaill", text: "Your subscription cancel."}
  
        await alertEmailSender(emailData)

        console.log('User subscription canceled successfully.');
      } else {
        console.log('User not found for this subscription.');
      }
      break;
    }

    case 'invoice.payment_failed': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      const user = await User.findById(userId);
      if (user) {
        user.subscription = false;
        user.isAutoSubscription = false;
        user.currentSubscriptionExpiredDate =null;
        user.currentSubscriptionPayDate=null;
        user.currentSubscriptionType = null;

        await user.save();

        console.log('User subscription marked as inactive due to payment failure.');
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
}

module.exports = {
  subscriptionPayment,
  createSubscription,
  getSubscriptionByUserId,
  isAutoSubscriptionCancel,
  createCheckoutSession,
  webhookController
};
