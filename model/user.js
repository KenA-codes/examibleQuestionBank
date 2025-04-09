const { lowerCase } = require("lodash");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true, //This trims before it validates
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowerCase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    
    isSuperAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


const userModel = mongoose.model("user", userSchema)
module.exports = userModel
