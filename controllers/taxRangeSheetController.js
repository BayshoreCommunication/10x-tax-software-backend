const TaxRangeSheet = require("../models/taxRangeSheet"); 
const createError = require("http-errors");
const { successResponse } = require("./responseController");

const mongoose = require("mongoose");

const createTaxRangeSheet = async (req, res, next) => {
  try {
    const { taxRates } = req.body;

    if (!taxRates || taxRates.length === 0) {
      throw createError(400, "Tax rates are required.");
    }

    let taxRangeSheet = await TaxRangeSheet.findOne();

    if (taxRangeSheet) {
      throw createError(400, "Tax range sheet already exists.");
    }

    taxRangeSheet = new TaxRangeSheet({
      taxRates,
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

const editTaxRangeSheet = async (req, res, next) => {
  try {



    const { id } = req.params;

    const { taxRates } = req.body;


    console.log(taxRates);
    

    if (!taxRates || taxRates.length === 0) {
      throw createError(400, "Tax rates are required.");
    }

    const taxRangeSheet = await TaxRangeSheet.findOne({ _id: id, }); 

    if (!taxRangeSheet) {
      throw createError(404, "Tax range sheet not found.");
    }

    taxRangeSheet.taxRates = taxRates;

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
  getTaxRangeSheet
};