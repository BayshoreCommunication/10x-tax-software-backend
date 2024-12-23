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
  forgetPasswordCheckOtp,
  newForgetPassword,
  updateUserData,
} = require("../controllers/usersController");
const { validateUserRegistration, validateUserPassword, validateUserForgatPassword, validateUserResetPassword } = require("../validator/auth");
const runValidation = require("../validator");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/multer");

userRouter.get("/users", isLoggedIn,  getAllUsers);
userRouter.get("/user", isLoggedIn, getUserById);
userRouter.post(
  "/user/register",
  // validateUserRegistration,
  // runValidation,
  processRegister
);
userRouter.post("/user/verify", activateUserAccount);
userRouter.delete("/user/:id", isLoggedIn, deleteUserById);
userRouter.put("/user", isLoggedIn, updateUserById);

userRouter.put("/update-user",  isLoggedIn, uploadSingle, updateUserData);


userRouter.put("/password-update", isLoggedIn, validateUserPassword, runValidation, updateUserPassword);

userRouter.post("/user/forget-password", forgetPassword);
userRouter.post("/user/forget-password/verify",  forgetPasswordCheckOtp);
userRouter.post("/user/forget-password/recovery",   newForgetPassword);

userRouter.post("/reset-password", isLoggedIn, validateUserResetPassword, runValidation,resetPassword);



module.exports = { userRouter };