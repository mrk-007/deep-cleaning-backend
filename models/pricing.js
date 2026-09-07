const mongoose = require('mongoose');
const { ulid } = require('ulid');

const pricingSchema = new mongoose.Schema({

    pricingId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'PRC_' + ulid(),
    },
    serviceDurationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceDuration',
      required: true,
    },
    bathroomCountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BathroomCount',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('Pricing', pricingSchema);
