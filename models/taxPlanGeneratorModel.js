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
      calculatedTax: { type: Number, required: true },
      effectiveTaxRate: { type: Number, required: true },
      marginalTaxRate: { type: Number, required: true },
      taxableIncome: { type: Number, required: true },
      totalDeductions: { type: Number, required: true },
      taxesOwed: { type: Number, required: true },
      annualGrossIncome: { type: Number, required: true },
      totalTaxWithoutDeduction: { type: Number, required: true },
      totalTaxAfterDeduction: { type: Number, required: true },
      taxSavedByDeductions: { type: Number, required: true },
    },

    taxProposalInfo: {
      estimatedOverpaymentOne: {
        year: { type: String, default: "2023" },
        amount: { type: Number, default: 0 },
        lastYearLost: { type: Number, default: 0 },
      },

      estimatedOverpaymentTwo: {
        year: { type: String, default: "2024" },
        amount: { type: Number, default: 0 },
        lastYearLost: { type: Number, default: 0 },
      },

      ourEstimatedOverpayment: {
        year: { type: String, default: "2025" },
        amount: { type: Number, default: 0 },
        estimatedLostLastYear: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

const TaxPlanGenerator = model("TaxPlanGenerator", taxPlanGeneratorSchema);

module.exports = TaxPlanGenerator;
