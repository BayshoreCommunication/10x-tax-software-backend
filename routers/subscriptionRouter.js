const express = require("express");
const subscriptionRouter = express.Router();
const { isLoggedIn } = require("../middleware/auth");
// const { validateUserRegistration } = require("../validator/auth");
// const runValidation = require("../validator");

const { getSubscriptionByUserId, createSubscription, subscriptionPayment, isAutoSubscriptionCancel } = require("../controllers/subscriptionController");

subscriptionRouter.post("/create-payment-intent",   isLoggedIn, subscriptionPayment);

subscriptionRouter.post("/subscription", isLoggedIn, createSubscription);

subscriptionRouter.get("/subscription/:id", getSubscriptionByUserId);

subscriptionRouter.put("/subscription-cancel",  isLoggedIn, isAutoSubscriptionCancel);


module.exports = {subscriptionRouter };