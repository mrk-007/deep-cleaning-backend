const mongoose = require('mongoose');

const subscriptionTypeSchema = new mongoose.Schema(
  {
    subscriptionName: {
      type: String,
      required: true,
      trim: true,
    },
    activeStatusReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActiveStatus',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionType', subscriptionTypeSchema);
