const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
  {
    serviceDurationReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceDuration',
      required: true,
    },
    bathroomCountReference: {
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

module.exports = mongoose.model('Pricing', pricingSchema);
