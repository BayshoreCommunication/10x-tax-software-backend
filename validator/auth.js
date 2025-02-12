const { body } = require("express-validator");

// User registration validation

const validateUserRegistration = [
  body("businessName").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email Address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password should be minimum 8 character long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{2,}$/
    )
    .withMessage(
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];


// User password validation

const validateUserPassword = [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Old Password is required")
    .isLength({ min: 8 })
    .withMessage("Old Password should be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
    .withMessage(
      "Old Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New Password is required")
    .isLength({ min: 8 })
    .withMessage("New Password should be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
    .withMessage(
      "New Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm Password does not match New Password");
      }
      return true;
    }),
];


// User forgat password validation

const validateUserForgatPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email Address"),
];

// User reset password validation

const validateUserResetPassword = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Token is missing"),
    
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New Password is required")
    .isLength({ min: 8 })
    .withMessage("New Password should be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
    .withMessage(
      "New Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm Password does not match New Password");
      }
      return true;
    }),
];


module.exports = { validateUserRegistration, validateUserPassword,validateUserForgatPassword,validateUserResetPassword };
