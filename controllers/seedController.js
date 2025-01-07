const data = require("../data");
const User = require("../models/userModel");

const seedUser = async (req, res, next) => {
  try {
    // Delete all users except those with isAdmin: true
    await User.deleteMany({ isAdmin: false });

    // Insert the new data
    const users = await User.insertMany(data);

    return res.status(201).json({ message: "Users seeded successfully" });
  } catch (error) {
    next(error);
  }
};


module.exports = { seedUser };
