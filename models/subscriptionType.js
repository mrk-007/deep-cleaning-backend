const mongoose = require('mongoose');
const { ulid } = require('ulid');

const subscriptionTypeSchema = new mongoose.Schema({

    subscriptionTypeId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'SUB_' + ulid(),
    },
    subscriptionName: {
      type: String,
      required: true,
      trim: true,
    },
    activeStatusId: {
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
