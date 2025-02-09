require("dotenv").config();

const serverPort = process.env.PORT || 8001;

const dataBaseUrl = process.env.DB_URL;

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";

const smptUser = process.env.SMPT_MAIL || "";

const smptPassword = process.env.SMPT_PASSWORD || " ";

const clientUrl = process.env.CLIENT_URL || "";

const cloudName =  process.env.CLOUDINARY_NAME || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret =process.env.CLOUDINARY_API_SECRET || "";


const stripeSecretKey =process.env.STRIPE_SECRET_KEY || "";
const stripeApiKey =process.env.STRIPE_API_KEY || "";
const stripeWebhookSecret=process.env.STRIPE_WEBHOOK_SECRET || "";


module.exports = {
  serverPort,
  dataBaseUrl,
  jwtSecretKey,
  smptUser,
  smptPassword,
  clientUrl,
  cloudName,
  apiKey,
  apiSecret,
  stripeSecretKey,
  stripeApiKey,
  stripeWebhookSecret
};
