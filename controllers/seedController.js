const data = require("../data");
const User = require("../models/userModel");

// Seed user create for testing only for developer

const seedUser = async (req, res, next) => {
  try {
    await User.deleteMany({ isAdmin: false });

    const users = await User.insertMany(data);

    return res.status(201).json({ message: "Users seeded successfully" });
  } catch (error) {
    next(error);
  }
};


module.exports = { seedUser };
