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
  const { amount, currency } = req.body;

  try {
    if (!amount || !currency) {
      throw createError(400, "Amount and currency are required.");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
    });

    return successResponse(res, {
      statusCode: 200,
      message: "Payment intent created successfully",
      payload: { clientSecret: paymentIntent.client_secret },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create payment intent."));
  }
};

/**
 * Creates a new subscription and updates the user's subscription details.
 */
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
    next(createError(500, error.message || "Failed to retrieve subscription data."));
  }
};





module.exports = {
  subscriptionPayment,
  createSubscription,
  getSubscriptionByUserId,
};
