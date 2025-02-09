// const express = require("express");
// const morgan = require("morgan");
// const cors = require('cors')
// const bodyParser = require("body-parser");
// const createError = require("http-errors");
// const xssClean = require("xss-clean");
// const cookieParser = require("cookie-parser");
// const rateLimit = require("express-rate-limit");
// const { userRouter } = require("./routers/userRouter");
// const { seedRouter } = require("./routers/seedRouter");
// const { authRouter } = require("./routers/authRouter");
// const { errorResponse } = require("./controllers/responseController");
// const { subscriptionRouter } = require("./routers/subscriptionRouter");
// const { taxRangeSheetRouter } = require("./routers/taxRangeSheetRoutes");
// const clientDetialsRouter = require("./routers/clientDetialsRouter");
// const textPlanGeneratorRouter = require("./routers/textPlanGeneratorRouter");
// const { stripeWebhookSecret, stripeSecretKey } = require("./secret");
// const Stripe = require('stripe');
// const stripe = Stripe(stripeSecretKey);

// require("./config/db");


// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   limit: 100,
// //   message: "Too many reqeust from this ip please try later",
// //   // standardHeaders: "draft-7",
// //   // legacyHeaders: false,
// // });

// const app = express();

// app.use(cookieParser());
// // app.use(limiter);
// app.use(cors())
// app.use(xssClean());
// app.use(morgan("dev"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));


// app.use("/api/seed", seedRouter);

// app.use("/api", authRouter);
// app.use("/api", userRouter);
// app.use("/api", subscriptionRouter);
// app.use("/api", taxRangeSheetRouter);
// app.use("/api", clientDetialsRouter);
// app.use("/api", textPlanGeneratorRouter);

// app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   const endpointSecret = stripeWebhookSecret;  // From Stripe Dashboard

//   let event;

//   try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//       console.error(`Webhook signature verification failed.`, err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Handle the event
//   switch (event.type) {
//       case 'payment_intent.succeeded':
//           const paymentIntent = event.data.object;
//           console.log('PaymentIntent was successful!', paymentIntent);
//           break;
//       default:
//           console.log(`Unhandled event type ${event.type}`);
//   }

//   res.status(200).send('Received');
// });


// app.get("/", (req, res) => {
//   return res.status(201).json({success: true, message:"welcome to the server"});
// });


// //client error handling

// app.use((req, res, next) => {
//   next(createError(404, "route not found"));
// });

// //server error handling

// app.use((err, req, res, next) => {
//   return errorResponse(res, { statusCode: err.status, message: err.message });
// });

// module.exports = app;

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const xssClean = require("xss-clean");
const cookieParser = require("cookie-parser");
const { userRouter } = require("./routers/userRouter");
const { seedRouter } = require("./routers/seedRouter");
const { authRouter } = require("./routers/authRouter");
const { errorResponse } = require("./controllers/responseController");
const { subscriptionRouter } = require("./routers/subscriptionRouter");
const { taxRangeSheetRouter } = require("./routers/taxRangeSheetRoutes");
const clientDetialsRouter = require("./routers/clientDetialsRouter");
const textPlanGeneratorRouter = require("./routers/textPlanGeneratorRouter");
const { stripeWebhookSecret, stripeSecretKey } = require("./secret");
const Stripe = require("stripe");


const stripe = Stripe(stripeSecretKey);

require("./config/db");

const app = express();

// Middleware setup
app.use(cookieParser());
app.use(cors());
app.use(xssClean());
app.use(morgan("dev"));


app.use("/api/webhook", express.raw({ type: "application/json" }));

app.use(bodyParser.json());

app.use("/api/seed", seedRouter);
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", subscriptionRouter);
app.use("/api", taxRangeSheetRouter);
app.use("/api", clientDetialsRouter);
app.use("/api", textPlanGeneratorRouter);


// Basic route for testing
app.get("/", (req, res) => {
  return res.status(201).json({ success: true, message: "Welcome to the server" });
});


// Client error handling for undefined routes
app.use((req, res, next) => {
  next(createError(404, "Route not found"));
});

// Server error handling
app.use((err, req, res, next) => {
  return errorResponse(res, { statusCode: err.status, message: err.message });
});

module.exports = app;
