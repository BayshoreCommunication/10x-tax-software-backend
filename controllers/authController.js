const mongoose = require("mongoose");
const createError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { successResponse } = require("./responseController");
const createJsonWebToken = require("../helper/jsonWebToken");
const { jwtSecretKey, clientUrl } = require("../secret");

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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

    const accessToken = await createJsonWebToken({ user }, jwtSecretKey, {
      expiresIn: "30d", 
    });
    
    res.cookie("accessToken", accessToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true,
      sameSite: "none", 
    });
    

    // const refreshToken = await createJsonWebToken({ user }, jwtSecretKey, {
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
      message: "User login successfully ",
      payload: { user },
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
  userLogout,
  userTokenRefresh 
};
