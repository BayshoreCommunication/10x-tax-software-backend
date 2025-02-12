const { Schema, model } = require("mongoose");

const taxBracketSchema = new Schema({
  min: {
    type: Number,
    required: true, 
  },
  max: {
    type: Number, 
    required: false,
  },
  rate: {
    type: Number,
    required: true, 
  },
});

const taxRangeSheetSchema = new Schema(
  {
    single: [taxBracketSchema],
    marriedFilingJointly: [taxBracketSchema], 
    marriedFilingSeparately: [taxBracketSchema], 
    headOfHousehold: [taxBracketSchema], 
  },
  { timestamps: true } 
);

const TaxRangeSheet = model("TaxRangeSheet", taxRangeSheetSchema);

module.exports = TaxRangeSheet;
