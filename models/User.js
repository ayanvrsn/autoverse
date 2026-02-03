const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    isVerified: { 
      type: Boolean, 
      default: false },
    verificationToken: {
      type: String
    },
    orderVerificationCodeHash: {
      type: String
    },
    orderVerificationExpiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
