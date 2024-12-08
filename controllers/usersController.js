const createError = require("http-errors");
const data = require("../data");
const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { findWithId } = require("../services/findWithId");
const createJsonWebToken = require("../helper/jsonWebToken");
const { jwtSecretKey, clientUrl } = require("../secret");
const sendEmailWithNodeMailer = require("../helper/email");
const jwt = require("jsonwebtoken");
const runValidation = require("../validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const generateOtpAndExpiration = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
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


const getAllUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 5);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);

    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      isAdmin: { $ne: true },
      $or: [
        { name: searchRegExp },
        { email: searchRegExp },
        { phone: searchRegExp },
      ],
    };

    const options = { password: 0 };

    const users = await User.find(filter, options)
      .limit(limit)
      .skip((page - 1) * limit);

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
    const id = req.params.id;
    
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
    const id = req.params.id;

    const user = await User.findByIdAndDelete({ _id: id, isAdmin: false });

    if (!user) {
      throw createError(404, "User dose not exist with this id");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "User successfully deleted",
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
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
    const userId = req.params.id;

    const updateOptions = { new: true, runValidators: true, context: "query" };

    await findWithId(User, userId, updateOptions);

    let updates = {};

    for (let key in req.body) {
      if (["name", "phone", "password", "address"].includes(key)) {
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


// Update user by id

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

const forgetPassword= async (req, res, next) => {
  try {
    const { email } = req.body;
   
    const user = await User.findOne({email: email});
    if (!user) {
      throw createError(404, "User not found");
    }

    const jwtToken = await createJsonWebToken(
      { email },
      jwtSecretKey,
      { expiresIn: "10m" }
    );

    const emailData = {
      email,
      subject: "Account Activation Email",
      html: `<h1>Hello ${user.name}!</h1> <p>Please click here to <a href = "${clientUrl}/api/user/reset-password/${jwtToken}" target = "_black">Reset Password</a></p>`,
    };

    try {
      await sendEmailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    return successResponse(res, {
      statusCode: 200,
      message: `Please go to your ${email} for resting your password`,
      payload: { token: jwtToken },
    });
  } catch (error) {

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }

    next(error);
  }
};

// reset password

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, jwtSecretKey);
    if (!decoded || !decoded.email) {
      throw createError(401, "Invalid or expired token");
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email }, 
      { password: newPassword },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw createError(400, "Failed to reset password");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Password was reset successfully",
      payload: { user: updatedUser },
    });
  } catch (error) {

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(createError(401, "Invalid or expired token"));
    }

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }


    next(error);
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
  forgetPassword,
  resetPassword
};
