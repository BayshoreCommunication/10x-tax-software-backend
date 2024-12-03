const express = require("express");
const authRouter = express.Router();
// const { validateUserRegistration } = require("../validator/auth");
// const runValidation = require("../validator");
const { userLogin, userLogout, userTokenRefresh } = require("../controllers/authController");

authRouter.get("/auth/login", userLogin);
authRouter.get("/auth/logout", userLogout);

authRouter.get("/refresh-token", userTokenRefresh);

module.exports = { authRouter };
