const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const { stripeSecretKey } = require("../secret");
const Stripe = require("stripe");

const stripe = new Stripe(stripeSecretKey);

/**
 * Handles the creation of a payment intent for a subscription.
 */
const subscriptionPayment = async (req, res, next) => {
  const { amount, currency, customerDetails, paymentMethodType } = req.body;

  try {
    if (!amount || !currency) {
      throw createError(400, "Amount and currency are required.");
    }

    // Ensure payment method type is provided, default to "us_bank_account"
    const paymentMethodTypes = paymentMethodType || ["us_bank_account"];

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: paymentMethodTypes, // Using provided payment method type
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


const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
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

    const search = req.query.search || "";
    const selectFilterOption = req.query.selectFilterOption || "All"; // Default to "All"
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 5);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);

    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    // Base filter
    const filter = {
      $or: [
        { subscriptionDate: searchRegExp },
        { subscriptionExpiredDate: searchRegExp },
        { type: searchRegExp },
      ],
      userId,
    };

    // Adjust filter based on `selectFilterOption`
    if (selectFilterOption === "Monthly") {
      filter["subscriptionInfo.type"] = "Monthly";
    } else if (selectFilterOption === "Yearly") {
      filter["subscriptionInfo.type"] = "Yearly";
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


// Cancle user auto subscription 

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

    return successResponse(res, {
      statusCode: 200, 
      message: "Auto subscription canceled successfully.",
      payload: { isAutoSubscription: user.isAutoSubscription }, 
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to cancel subscription."));
  }
};




module.exports = {
  subscriptionPayment,
  createSubscription,
  getSubscriptionByUserId,
  isAutoSubscriptionCancel
};
