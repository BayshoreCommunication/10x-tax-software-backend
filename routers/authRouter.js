const express = require("express");
const authRouter = express.Router();
// const { validateUserRegistration } = require("../validator/auth");
// const runValidation = require("../validator");
const { userLogin, userLogout, userTokenRefresh, userLoginOtpVerify } = require("../controllers/authController");

authRouter.post("/user/login", userLogin);
authRouter.post("/user/login-otp-verify", userLoginOtpVerify);
authRouter.get("/user/logout", userLogout);

authRouter.get("/refresh-token", userTokenRefresh);

module.exports = { authRouter };
