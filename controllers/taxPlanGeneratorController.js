const TaxPlanGenerator = require("../models/taxPlanGeneratorModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");

const createTaxPlan = async (req, res, next) => {
  try {
    const { userId, taxableIncome, estimatedFederalTaxes } = req.body;

    const newTaxPlan = new TaxPlanGenerator({
      userId,
      taxableIncome,
      estimatedFederalTaxes,
    });

    await newTaxPlan.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan generated successfully",
      payload: {newTaxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create tax plan."));
  }
};

const getTaxPlanByUserId = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const taxPlan = await TaxPlanGenerator.findOne({ userId });
    if (!taxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan retrieved successfully",
      payload: {taxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve tax plan."));
  }
};

const updateTaxPlan = async (req, res, next) => {
  try {
    const { id: _id } = req.params;
    const updateData = req.body;

    const updatedTaxPlan = await TaxPlanGenerator.findOneAndUpdate(
      { _id },
      updateData,
      { new: true }
    );
    if (!updatedTaxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan updated successfully",
      payload: {updatedTaxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to update tax plan."));
  }
};

const deleteTaxPlan = async (req, res, next) => {
  try {
    const { id: _id } = req.params;

    const deletedTaxPlan = await TaxPlanGenerator.findOneAndDelete({  _id });
    if (!deletedTaxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Tax plan deleted successfully",
      payload: {}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to delete tax plan."));
  }
};

module.exports = {
  createTaxPlan,
  getTaxPlanByUserId,
  updateTaxPlan,
  deleteTaxPlan,
};
