const mongoose = require('mongoose');

const serviceDurationSchema = new mongoose.Schema(
  {
    durationMinutes: {
      type: Number,
      required: true,
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

module.exports = mongoose.model('ServiceDuration', serviceDurationSchema);
