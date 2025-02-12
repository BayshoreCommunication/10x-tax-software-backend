const { Schema, model } = require("mongoose");

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, 
      required: true,
    },
    paymentInfo: {
      email: {
        type: String,
        required: true,
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
        enum: ["month", "year"],
      },
    },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", subscriptionSchema);

module.exports = Subscription;
