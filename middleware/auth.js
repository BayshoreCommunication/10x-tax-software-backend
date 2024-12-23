const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const { jwtSecretKey } = require("../secret");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization ;


    if (!token) {
      throw createError(401, "Access denied. No token provided");
    }

    const decoded = jwt.verify(token, jwtSecretKey);

    if (!decoded) {
      throw createError(401, "Your token is invalid");
    }


    if (!decoded?.user?.isActive) {
      throw createError(401, "User is not active");
    }

    req.user = decoded.user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      next(createError(401, "Invalid or expired token"));
    } else {
      next(error);
    }
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      throw createError(
        403,
        "Forbidden! You must be an admin to access this resource"
      );
    }

    if (!user.isActive) {
      throw createError(401, "Admin is not active");
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isLoggedIn, isAdmin };
