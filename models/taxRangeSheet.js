const { Schema, model } = require("mongoose");


const taxRangeSheetSchema = new Schema(
  {
    taxRates: [
      {
        TaxRate: {
          type: Number,
          required: true, 
        },
        Individual: {
          min: {
            type: Number,
            required: true, 
          },
          max: {
            type: Number,
            required: true, 
          },
        },
        MarriedFilingJointly: {
          min: {
            type: Number,
            required: true, 
          },
          max: {
            type: Number,
            required: true, 
          },
        },
        MarriedFilingSeparately: {
          min: {
            type: Number,
            required: true, 
          },
          max: {
            type: Number,
            required: true, 
          },
        },
        HeadOfHousehold: {
          min: {
            type: Number,
            required: true, 
          },
          max: {
            type: Number,
            required: true, 
          },
        },
      },
    ],
  },
  { timestamps: true }
);

const TaxRangeSheet = model("TaxRangeSheet", taxRangeSheetSchema);

module.exports = TaxRangeSheet;
