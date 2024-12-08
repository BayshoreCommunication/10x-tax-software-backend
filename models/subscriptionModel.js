const { Schema, model } = require("mongoose");

const subscriptionSchema = new Schema(
  {
    paymentInfo: {
      email: {
        type: String,
        required: true,
        validate: {
          validator: function (value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
          },
          message: "Please enter a valid email address",
        },
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
      },
      paymentId: {
        type: String,
        required: true,
      },
    },
    subscriptionInfo: {
      subscriptionDate: {
        type: Date,
        required: true,
      },
      subscriptionExpiredDate: {
        type: Date,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["monthly", "yearly"], // Add possible subscription types here
      },
    },
  },
  { timestamps: true } // Add timestamps to track creation and update times
);

const Subscription = model("Subscription", subscriptionSchema);

module.exports = Subscription;

