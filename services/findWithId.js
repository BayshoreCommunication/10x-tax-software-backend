const mongoose = require("mongoose");
const createError = require("http-errors");

const findWithId = async (Model, id, options = {}) => {
  try {

    
    const item = await Model.findById(id, options);

    if (!item) {
      throw createError(404, `${Model.modelName} dose not exist with this id`);
    }
    return item;
  } catch (error) {
    if (error instanceof mongoose.Error) {
      throw createError(400, "Invalid Item Id");
      return;
    }
    throw error;
  }
};

module.exports = { findWithId };
