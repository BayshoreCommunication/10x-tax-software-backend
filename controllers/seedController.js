const data = require("../data");
const User = require("../models/userModel");

const seedUser = async (req, res, next) => {
  try {
    // await User.deleteMany({});

    // const users = await User.insertMany(data);

    return res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { seedUser };
