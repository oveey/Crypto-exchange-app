const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
    },
    emailOtp: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: 'https://i.postimg.cc/hj3g9nRG/profile-avatar.png',
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    bankDetails: {
      bankName: {
        type: String,
        trim: true,
      },
      bankAccountNumber: {
        type: String,
        trim: true,
      },
      bankCode: {
        type: String,
        trim: true,
      },
      isBankDetailsVerified: {
        type: Boolean,
        default: false,
      },
    },
    notificationStatus: {
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    security: {
      isTwoFactorAuthActive: {
        type: Boolean,
        default: false,
      },
    },
    settings: {
      receiveWeeklyNewsletter: {
        type: Boolean,
        default: false,
      },
      optInForSMSNotification: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: 'English',
      },
    },
    role: {
      type: String,
      enum: ['user', 'customersAdmin', 'companyAdmin', 'manager'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const User = model('User', userSchema);

module.exports = User;
