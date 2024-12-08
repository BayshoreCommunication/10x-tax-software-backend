const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Stripe", "Other"],
      required: true,
    },
    paymentTimestamp: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically cancel orders if payment is not completed within 72 hours
orderSchema.pre('save', function (next) {
  if (this.paymentStatus === 'Pending' && this.createdAt) {
    const now = new Date();
    const timeSinceCreated = now - this.createdAt;
    if (timeSinceCreated > 72 * 60 * 60 * 1000) { // 72 hours in milliseconds
      this.status = 'Cancelled';
      this.paymentStatus = 'Failed';
    }
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
