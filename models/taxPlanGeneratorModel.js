const { Schema, model } = require("mongoose");

const taxPlanGeneratorSchema = new Schema(
  {

    userId: {
      type: Schema.Types.ObjectId, 
      required: true,
    },

    clientId: {
      type: Schema.Types.ObjectId, 
      required: true,
    },

    taxInfo: {
      ageDeductions:  { type: Number, required: true },
      calculatedTax:  { type: Number, required: true },
      effectiveTaxRate:  { type: Number, required: true },
      marginalTaxRate:  { type: Number, required: true },
      taxableIncome:  { type: Number, required: true },
      totalDeductions:  { type: Number, required: true },
      standardAndItemizedDeduction:  { type: Number, required: true },
      otherDeductions:  { type: Number, required: true },
      strategyDeductions:  { type: Number, required: true },
      taxesWithheld:  { type: Number, required: true },
      taxCredits:  { type: Number, required: true },
      taxesOwed:  { type: Number, required: true },
      beforAdjustingTax:  { type: Number, required: true },
      annualGrossIncome:  { type: Number, required: true },
      retirementDeduction:  { type: Number, required: true },
      dependentsDeduction:  { type: Number, required: true },
    },

    taxProposalInfo: {
      year2023: { type: Number, required: true },
      year2024: { type: Number, required: true },
      year2025: { type: Number, required: true },
      lastYearLost: { type: Number, required: true }, 
    },
    
  },
  { timestamps: true }
);

const TaxPlanGenerator = model("TaxPlanGenerator", taxPlanGeneratorSchema);

module.exports = TaxPlanGenerator;
