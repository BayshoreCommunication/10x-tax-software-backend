const { Schema, model } = require("mongoose");

const taxPlanGeneratorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, 
      required: true,
    },
    taxableIncome: [
      {
        grossIncome: { type: Number, required: true },
        standardDeduction: { type: Number, required: true },
        retirementContributions: { type: Number, required: true },
        otherDeductions: { type: Number, required: true },
        taxableIncome: { type: Number, required: true },
      },
    ],
    estimatedFederalTaxes: [
      {
        estimatedTaxesBeforeAdjustments: { type: Number, required: true },
        federalTaxesWithheld: { type: Number, required: true },
        taxCredits: { type: Number, required: true },
        taxesOwed: { type: Number, required: true },
        marginalTaxRate: { type: Number, required: true },
        effectiveTaxRate: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const TaxPlanGenerator = model("TaxPlanGenerator", taxPlanGeneratorSchema);

module.exports = TaxPlanGenerator;
