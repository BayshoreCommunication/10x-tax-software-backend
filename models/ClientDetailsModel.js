const { Schema, model } = require("mongoose");

const clientDetailsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    basicInformation: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      profession: { type: String, required: true },
      annualGrossIncome: { type: Number, required: true },
      dateOfBirth: { type: Date, required: true },
      maritalStatus: { type: String, required: true },
      address: { type: String, required: true },
      spouseDetails: {
        fullName: String,
        profession: String,
        income: Number,
        dateOfBirth: Date,
      },
    },
    fillingStatus: { type: String, default: "single" },
    strategy: {
      homeOffice: String,
      depreciation: String,
      travel: String,
      meals: String,
      hiringChildren: String,
      scheduleCToSCorp: String,
      costSegregation: String,
      rentHomeToCorporation: String,
    },

    dependents: {
      underAge17: String,
    },
  },
  { timestamps: true }
);

const ClientDetails = model("ClientDetails", clientDetailsSchema);

module.exports = ClientDetails;
