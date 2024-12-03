const jwt = require("jsonwebtoken");

const createJsonWebToken = async (payload, secretKey, options = {}) => {
  try {
    const token = jwt.sign(payload, secretKey, options);
    return token;
  } catch (error) {
    throw new Error("Failed to create JWT: " + error.message);
  }
};

module.exports = createJsonWebToken;
