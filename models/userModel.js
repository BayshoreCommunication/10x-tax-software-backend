const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Business email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
        },
        message: "Please enter a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        8,
        "The length of the password must be at least 8 characters",
      ],
      set: function (value) {
        return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
      },
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (value) {
          return /^[0-9]+$/.test(value);
        },
        message: "Phone number should only contain digits",
      },
    },

    address: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(
            value
          );
        },
        message: "Please enter a valid URL",
      },
    },

    businessWebsite: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(
            value
          );
        },
        message: "Please enter a valid URL",
      },
    },

    brandColor: {
      type: String,
      trim: true,
    },

    logoUrl: {
      type: String,
    },

    registerDate: {
      type: Date,
    },

    subscription: {
      type: Boolean,
      default: false,
    },

    currentSubscriptionPayDate: {
      type: Date,
    },

    currentSubscriptionExpiredDate: {
      type: Date,
    },

    currentSubscriptionType: {
      type: String,
      enum: ["monthly", "yearly"], 
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    otp: { type: String }, 
    otpExpiration: { type: Date }, 
    isActive : {type: Boolean, default: false}

  },
  { timestamps: true }
);

const User = model("User", userSchema);

module.exports = User;


