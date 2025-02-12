const TaxRangeSheet = require("../models/taxRangeSheet");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const mongoose = require("mongoose");


// Create tax  range sheet by admin

const createTaxRangeSheet = async (req, res, next) => {
  try {
    const { single, marriedFilingJointly, marriedFilingSeparately, headOfHousehold } = req.body;

    if (!single || !marriedFilingJointly || !marriedFilingSeparately || !headOfHousehold) {
      throw createError(400, "All filing statuses (Single, MarriedFilingJointly, MarriedFilingSeparately, HeadOfHousehold) are required.");
    }

    let taxRangeSheet = await TaxRangeSheet.findOne();
    if (taxRangeSheet) {
      throw createError(400, "Tax range sheet already exists.");
    }

    taxRangeSheet = new TaxRangeSheet({
      single,
      marriedFilingJointly,
      marriedFilingSeparately,
      headOfHousehold,
    });

    await taxRangeSheet.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Tax range sheet created successfully.",
      payload: { taxRangeSheet },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return next(createError(400, "Invalid data format."));
    }
    next(error);
  }
};


// Update tax  range sheet by admin

const editTaxRangeSheet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { single, marriedFilingJointly, marriedFilingSeparately, headOfHousehold } = req.body;

    if (!single && !marriedFilingJointly && !marriedFilingSeparately && !headOfHousehold) {
      throw createError(400, "At least one filing status must be provided for update.");
    }

    const taxRangeSheet = await TaxRangeSheet.findById(id);
    if (!taxRangeSheet) {
      throw createError(404, "Tax range sheet not found.");
    }

    if (single) taxRangeSheet.single = single;
    if (marriedFilingJointly) taxRangeSheet.marriedFilingJointly = marriedFilingJointly;
    if (marriedFilingSeparately) taxRangeSheet.marriedFilingSeparately = marriedFilingSeparately;
    if (headOfHousehold) taxRangeSheet.headOfHousehold = headOfHousehold;

    await taxRangeSheet.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Tax range sheet updated successfully.",
      payload: { taxRangeSheet },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid Tax Range Sheet ID."));
    }
    next(error);
  }
};

// Get tax  range sheet 

const getTaxRangeSheet = async (req, res, next) => {
  try {
    const taxRangeSheet = await TaxRangeSheet.findOne();

    if (!taxRangeSheet) {
      throw createError(404, "Tax range sheet not found.");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Tax range sheet fetched successfully.",
      payload: { taxRangeSheet },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid Tax Range Sheet ID."));
    }
    next(error);
  }
};

module.exports = {
  createTaxRangeSheet,
  editTaxRangeSheet,
  getTaxRangeSheet,
};
