const mongoose = require("mongoose");
const createError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { successResponse } = require("./responseController");
const createJsonWebToken = require("../helper/jsonWebToken");
const { jwtSecretKey, clientUrl } = require("../secret");
const sendEmailWithNodeMailer = require("../helper/email");

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("check username: " , email, password);
    

    const user = await User.findOne({ email });

    if (!user) {
      throw createError(
        404,
        "User does not exist with this email, Please register first"
      );
    }


    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw createError(404, "Email/Password did not match");
    }

  
    if (user.isBanned) {
      throw createError(403, "You are banned please contact with authority");
    }


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = Date.now() + 10 * 60 * 1000; 

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    const emailData = {
      email,
      subject: "10xTax Sign-in Verification",
      html: `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
  <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
    <div style="background-color: #000000; color: white; text-align: center; padding: 20px;">
      <h1 style="margin: 0; font-size: 24px;">Verify your email</h1>
    </div>
    <div style="padding: 30px; text-align: center;">
      <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hello ${"AR Sahak"}!</h1>
      <p style="font-size: 16px; color: #555555; line-height: 1.5; margin: 0 0 20px;">
        We have received a login attempt to your account. Use the verification code below to proceed:
      </p>
      <div style="font-size: 28px; font-weight: bold; color: #333333; margin: 20px 0;">
        ${otp}
      </div>
    </div>
    <div style="text-align: center; font-size: 12px; color: #888888; margin-top: 20px; padding: 10px;">
      If you did not attempt to log in, please ignore this email.
    </div>
  </div>
</body>`,
    };

    
    try {
      await sendEmailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    return successResponse(res, {
      statusCode: 201,
      message: "OTP sent to your email address. Please verify.",
      payload: {  },
    });
  } catch (error) {
    next(error);
  }
};


const userLoginOtpVerify = async (req, res, next) => {
  try {
    const { email, otp } = req.body;


    if (!email || !otp) {
      throw createError(400, "Email and OTP are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, "User does not exist.");
    }

    if (user.otp !== otp) {
      throw createError(400, "Invalid OTP.");
    }
    if (user.otpExpiration < Date.now()) {
      throw createError(400, "OTP has expired.");
    }

    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    const accessToken = await createJsonWebToken({user}, jwtSecretKey, {
      expiresIn: "30d",
    });

    const { password, otp: _, otpExpiration: __, ...userWithoutSensitiveData } = user.toObject();

    res.cookie("accessToken", accessToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true,
      // secure: true, 
      sameSite: "strict",
    });

   
    return successResponse(res, {
      statusCode: 200,
      message: "OTP verified successfully.",
      payload: { user: userWithoutSensitiveData, accessToken },
    });
  } catch (error) {
    next(error);
  }
};




const userLogout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");

    return successResponse(res, {
      statusCode: 201,
      message: "User logout successfully",
    });
  } catch (error) {
    next(error);
  }
};


const userTokenRefresh = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken


    // const decoded = jwt.verify(oldRefreshToken,  jwtSecretKey)

    // if{!decoded}{
    //   throw createError (400, "Invalid refresh token, please login again ")
    // }

    // const accessToken = await createJsonWebToken(decoded.user, jwtSecretKey, {
    //   expiresIn: "1min",
    // });

    // res.cookie("accessToken", accessToken, {
    //   maxAge: 1 * 60 * 1000,
    //   httpOnly: true,
    //   // secure: true,
    //   sameSite: "none",
    // });


    // const refreshToken = await createJsonWebToken(decoded.user, jwtSecretKey, {
    //   expiresIn: "7d",
    // });

    // res.cookie("refreshToken", refreshToken, {
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    //   httpOnly: true,
    //   // secure: true,
    //   sameSite: "none",
    // });

    return successResponse(res, {
      statusCode: 201,
      message: "New access token is generated",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userLogin,
  userLoginOtpVerify,
  userLogout,
  userTokenRefresh 
};
