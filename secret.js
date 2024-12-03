require("dotenv").config();

const serverPort = process.env.PORT || 8001;

const dataBaseUrl = process.env.DB_URL;

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";

const smptUser = process.env.SMPT_MAIL || "";

const smptPassword = process.env.SMPT_PASSWORD || " ";

const clientUrl = process.env.CLIENT_URL || "";

module.exports = {
  serverPort,
  dataBaseUrl,
  jwtSecretKey,
  smptUser,
  smptPassword,
  clientUrl,
};
