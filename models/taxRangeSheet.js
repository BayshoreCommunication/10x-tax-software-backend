const { Schema, model } = require("mongoose");

const taxBracketSchema = new Schema({
  min: {
    type: Number,
    required: true, // Minimum income for this tax bracket
  },
  max: {
    type: Number, // Maximum income for this tax bracket; null if there is no upper limit
    required: false,
  },
  rate: {
    type: Number,
    required: true, // Tax rate for this bracket
  },
});

const taxRangeSheetSchema = new Schema(
  {
    single: [taxBracketSchema], // Array of tax brackets for 'Single' filing status
    marriedFilingJointly: [taxBracketSchema], // Array of tax brackets for 'Married filing jointly'
    marriedFilingSeparately: [taxBracketSchema], // Array of tax brackets for 'Married filing separately'
    headOfHousehold: [taxBracketSchema], // Array of tax brackets for 'Head of household'
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt` timestamps
);

const TaxRangeSheet = model("TaxRangeSheet", taxRangeSheetSchema);

module.exports = TaxRangeSheet;
