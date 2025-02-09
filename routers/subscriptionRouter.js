const express = require("express");
const bodyParser = require("body-parser");
const subscriptionRouter = express.Router();
const { isLoggedIn } = require("../middleware/auth");
// const { validateUserRegistration } = require("../validator/auth");
// const runValidation = require("../validator");

const { getSubscriptionByUserId, createSubscription, subscriptionPayment, isAutoSubscriptionCancel, webhookController, createCheckoutSession } = require("../controllers/subscriptionController");

subscriptionRouter.post("/create-payment-intent",   isLoggedIn, subscriptionPayment);

subscriptionRouter.post("/subscription", isLoggedIn, createSubscription);

subscriptionRouter.get("/subscription/:id", isLoggedIn, getSubscriptionByUserId);

subscriptionRouter.put("/subscription-cancel",  isLoggedIn, isAutoSubscriptionCancel);

subscriptionRouter.post('/webhook',   webhookController);

subscriptionRouter.post('/create-checkout-session', isLoggedIn, createCheckoutSession);


module.exports = {subscriptionRouter};