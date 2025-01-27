const createError = require("http-errors");
const data = require("../data");
const User = require("../models/userModel");
const ClientDetails = require("../models/ClientDetailsModel");
const TaxPlanGenerator = require("../models/taxPlanGeneratorModel");
const { successResponse } = require("./responseController");
const { findWithId } = require("../services/findWithId");
const createJsonWebToken = require("../helper/jsonWebToken");
const { jwtSecretKey, clientUrl, stripeSecretKey } = require("../secret");
const sendEmailWithNodeMailer = require("../helper/email");
const jwt = require("jsonwebtoken");
const runValidation = require("../validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ProposalSend = require("../models/proposalSendModel");
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateOtpAndExpiration = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiration = Date.now() + 10 * 60 * 1000; 
  return { otp, otpExpiration };
};

// Helper function to send verification email
const sendVerificationEmail = async (email, otp, businessName) => {
  const emailData = {
    email,
    subject: "10xTax Sign-up Verification",
    html: `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background-color: #000000; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px;">Verify your email</h1>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hello ${businessName}!</h1>
            <p style="font-size: 16px; color: #555555; line-height: 1.5; margin: 0 0 20px;">
              We have received a sign-up attempt for your account. Use the verification code below to complete your registration:
            </p>
            <div style="font-size: 28px; font-weight: bold; color: #333333; margin: 20px 0;">
              ${otp}
            </div>
          </div>
          <div style="text-align: center; font-size: 12px; color: #888888; margin-top: 20px; padding: 10px;">
            If you did not attempt to register, please ignore this email.
          </div>
        </div>
      </body>
    `,
  };

  try {
    await sendEmailWithNodeMailer(emailData); // Ensure this function handles errors internally
  } catch (error) {
    throw new Error('Failed to send verification email');
  }
};


// Get All Users for admin account
const getAllUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);

    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      isAdmin: { $ne: true },
      $or: [
        { businessName: searchRegExp },
        { address: searchRegExp },
        { businessWebsite: searchRegExp },
        { email: searchRegExp },
        { phone: searchRegExp },
      ],
    };

    const options = { password: 0 };

    const users = await User.find(filter, options)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.find(filter).countDocuments();

    if (!users) throw createError(404, "no users found ");

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      statusCode: 201,
      message: "Users successfully returned",
      payload: {
        users,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};



// Get User by Id

const getUserById = async (req, res, next) => {
  try {
    
    const id = req.user._id;
    
    const options = { password: 0 };

    const user = await findWithId(User, id, options);

    return successResponse(res, {
      statusCode: 201,
      message: "User successfully returned",
      payload: { user },
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};



// Delete User for Admin

const deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete the user with the given ID only if `isAdmin` is false
    const user = await User.findOneAndDelete({ _id: id, isAdmin: false });

    if (!user) {
      // User not found or `isAdmin` is true
      return next(createError(404, "User does not exist with this ID or is an admin"));
    }

    // Respond with success
    return successResponse(res, {
      statusCode: 200,
      message: "User successfully deleted",
    });
  } catch (error) {
    // Handle invalid ID format
    if (error.name === "CastError") {
      return next(createError(400, "Invalid ID format"));
    }
    // Pass other errors to the global error handler
    next(error);
  }
};




// Process Register

const processRegister = async (req, res, next) => {
  try {
    const { businessName, email, phone, password } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.isActive) {
        // Resend OTP for inactive users
        const { otp, otpExpiration } = generateOtpAndExpiration();
        user.otp = otp;
        user.otpExpiration = otpExpiration;
        user.businessName = businessName;
        user.password = password;
        user.phone = phone;

        await user.save();
        await sendVerificationEmail(email, otp, user.businessName);

        return successResponse(res, {
          statusCode: 200,
          message: `Please check your email (${email}) to activate your account.`,
        });
      }

      return successResponse(res, {
        statusCode: 409,
        message: "User already registered and active.",
      });
    }

    // Register a new user
    const { otp, otpExpiration } = generateOtpAndExpiration();
    const newUser = new User({
      businessName,
      email,
      phone,
      password,
      otp,
      otpExpiration,
      subscription: false,
      isActive: false,
    });

    await newUser.save();

    await sendVerificationEmail(email, otp, businessName);

    return successResponse(res, {
      statusCode: 200,
      message: `Please check your email (${email}) to activate your account.`,
    });
  } catch (error) {
    next(error);
  }
};


// Active user

const activateUserAccount = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    if (!email || !otp) {
      return next(createError(400, "Email and OTP are required."));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, "User does not exist."));
    }

    // Validate OTP and its expiration
    if (user.otp !== otp) {
      return next(createError(400, "Invalid OTP."));
    }

    if (user.otpExpiration < Date.now()) {
      return next(createError(400, "OTP has expired."));
    }

    // Activate user account
    user.otp = null;
    user.otpExpiration = null;
    user.isActive = true;

    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "User account activated successfully.",
    });
  } catch (error) {
    next(error);
  }
};




// Update user by id

const updateUserById = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const updateOptions = { new: true, runValidators: true, context: "query" };

    await findWithId(User, userId, updateOptions);

    let updates = {};

    for (let key in req.body) {
      if (["businessName", "phone", "address", "website", "businessWebsite", "brandColor", " logoUrl"].includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      updates,
      updateOptions
    );

    if (!updateUser) {
      throw createError(404, "User with is id does not exist");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "User was update successfully",
      payload: updateUser,
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};

// User Data Update 

const updateUserData = async (req, res, next) => {
  try {
    const userId = req.user;

    // Destructure the request body
    const {
      businessName,
      businessWebsite,
      phone,
      address,
      brandColor,
      website,
    } = req.body;

    const updateData = {};


    if (businessName) updateData.businessName = businessName;
    if (businessWebsite) updateData.businessWebsite = businessWebsite;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (brandColor) updateData.brandColor = brandColor;
    if (website) updateData.website = website;

 
    if (req.file && req.file.path) {
      updateData.logoUrl = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, 
      runValidators: true, 
    });

    if (!updatedUser) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "User was updated successfully",
      payload: updatedUser,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid user ID",
      });
    }
    next(error);
  }
};





const updateUserPassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;


    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }


    const comparePassword = await bcrypt.compare(oldPassword, user.password);
    if (!comparePassword) {
      throw createError(400, "Invalid old password");
    }


    if (newPassword !== confirmPassword) {
      throw createError(400, "New Password and Confirm Password do not match");
    }



    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw createError(400, "Failed to update password");
    }


    return successResponse(res, {
      statusCode: 200,
      message: "User password updated successfully",
      payload: { user: updatedUser },
    });
  } catch (error) {

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }

    next(error);
  }
};


// Forget password

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, "Email is not registered.");
    }

    const { otp, otpExpiration } = generateOtpAndExpiration();

    await sendVerificationEmail(email, otp, user.businessName);

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: `Please check your email (${email}) to reset your password.`,
    });
  } catch (error) {
    next(error);
  }
};


// Forget password check otp

const forgetPasswordCheckOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;


    

    if (!email || !otp) {
      return next(createError(400, "Email and OTP are required."));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, "User does not exist."));
    }


    if (user.otp !== otp) {
      return next(createError(400, "Invalid OTP."));
    }

    if (user.otpExpiration < Date.now()) {
      return next(createError(400, "OTP has expired."));
    }

    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (error) {
    next(error);
  }
};


//set new password

const newForgetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(createError(400, "Email and new password are required."));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, "User does not exist."));
    }

    user.password =  newPassword;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};



// Reset password process

const resetPasswordProcess = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword ) {
      return next(
        createError(400, "Old Password and New Password are required.")
      );
    }
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return next(createError(400, "Old password is incorrect."));
    }

    if (oldPassword === newPassword) {
      return next(createError(400, "New password must be different from the old password."));
    }

    const { otp, otpExpiration } = generateOtpAndExpiration();

    await sendVerificationEmail(user.email, otp, user.businessName);

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "OTP sent successfully",
      payload: {
        message: `Please check your email (${user.email}) to verify your account.`,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }
    next(error);
  }
};

// Reset password process otp verify

const resetPasswordOtpVerify = async (req, res, next) => {
  try {
    const { oldPassword, newPassword,  fullOtp } = req.body;

    if (!oldPassword || !newPassword || !fullOtp) {
      return next(
        createError(400, "OTP are required.")
      );
    }


    

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return next(createError(404, "User does not exist."));
    }

    if (user.otp !== fullOtp) {
      return next(createError(400, "Invalid OTP."));
    }

    if (user.otpExpiration < Date.now()) {
      return next(createError(400, "OTP has expired."));
    }
    

    user.password =  newPassword;
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Password updated successfully",
      payload: {
        message: "Your password has been reset successfully.",
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }
    next(error);
  }
};


// Email Change Process

const emailChangeProcess = async (req, res, next) => {
  try {

    const {email} = req.body

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.email === email) {
      return next(createError(400, "New email must be different from the old email."));
    }

    const { otp, otpExpiration } = generateOtpAndExpiration();

    await sendVerificationEmail(email, otp, user.businessName);

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "OTP sent successfully",
      payload: { },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }
    next(error);
  }
};

// Email change process otp verify

const emailChangeOtpVerify = async (req, res, next) => {
  try {
    const { email, fullOtp } = req.body;

    if (!email) {
      return next(
        createError(400, "email are required.")
      );
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return next(createError(404, "User does not exist."));
    }

    if (user.otp !== fullOtp) {
      return next(createError(400, "Invalid OTP."));
    }

    if (user.otpExpiration < Date.now()) {
      return next(createError(400, "OTP has expired."));
    }

    user.email = email;
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Email updated successfully",
      payload: {},
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    };
    next(error);
  }
};


//User dashboard overview

const userOverViewDetails = async (req, res, next) => {
  try {

    const userId = req.user._id;

    const [user, clients, taxPlans, proposalSendList] = await Promise.all([
      User.findById(userId),
      ClientDetails.find({ userId }),
      TaxPlanGenerator.find({ userId }),
      ProposalSend.find({ userId }),
    ]);


    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (!clients) {
      throw createError(404, "No clients found for this user.");
    }
    if (!taxPlans ) {
      throw createError(404, "No tax plans found for this user.");
    }
    if (!proposalSendList ) {
      throw createError(404, "No proposals found for this user.");
    }

    const overview = {
      totalClient: clients.length,
      subscriptionPlan: user.subscription || "N/A", 
      paymentStatus: user.currentSubscriptionType || "N/A", 
      subscriptionEndDate: user.currentSubscriptionExpiredDate || "N/A",
      totalPlan: taxPlans.length,
      totalProposalSend: proposalSendList.length,
    };

    return successResponse(res, {
      statusCode: 200,
      message: "User overview list fetched successfully.",
      payload: { overview},
    });
  } catch (error) {
    next(createError(500, error.message || "An error occurred while fetching user overview list."));
  }
};


module.exports = {
  getAllUsers,
  getUserById,
  deleteUserById,
  processRegister,
  activateUserAccount,
  updateUserById,
  updateUserPassword,
  resetPasswordProcess,
  resetPasswordOtpVerify,
  forgetPassword,
  forgetPasswordCheckOtp,
  newForgetPassword,
  updateUserData,
  emailChangeProcess,
  emailChangeOtpVerify,
  userOverViewDetails
};
