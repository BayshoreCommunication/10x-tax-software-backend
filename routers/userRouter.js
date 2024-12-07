const express = require("express");
const userRouter = express.Router();

const {
  getAllUsers,
  getUserById,
  deleteUserById,
  processRegister,
  activateUserAccount,
  updateUserById,
  updateUserPassword,
  forgetPassword,
  resetPassword,
} = require("../controllers/usersController");
const { validateUserRegistration, validateUserPassword, validateUserForgatPassword, validateUserResetPassword } = require("../validator/auth");
const runValidation = require("../validator");
const { isLoggedIn, isAdmin } = require("../middleware/auth");

userRouter.get("/users", isLoggedIn,  getAllUsers);
userRouter.get("/user/:id", isLoggedIn, getUserById);
userRouter.post(
  "/user/register",
  // validateUserRegistration,
  // runValidation,
  processRegister
);
userRouter.post("/user/verify", activateUserAccount);
userRouter.delete("/user/:id", isLoggedIn, deleteUserById);
userRouter.put("/user/:id", isLoggedIn, updateUserById);
userRouter.put("/password-update", isLoggedIn, validateUserPassword, runValidation, updateUserPassword);

userRouter.post("/forget-password", isLoggedIn, validateUserForgatPassword, runValidation,forgetPassword);

userRouter.post("/reset-password", isLoggedIn, validateUserResetPassword, runValidation,resetPassword);

module.exports = { userRouter };