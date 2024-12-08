const express = require("express");
const authRouter = express.Router();
// const { validateUserRegistration } = require("../validator/auth");
// const runValidation = require("../validator");
const { userLogin, userLogout, userTokenRefresh, userLoginOtpVerify } = require("../controllers/authController");

authRouter.get("/user/login", userLogin);
authRouter.get("/user/login-otp-verify", userLoginOtpVerify);
authRouter.get("/user/logout", userLogout);

authRouter.get("/refresh-token", userTokenRefresh);

module.exports = { authRouter };
