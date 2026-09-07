const mongoose = require('mongoose');
const { ulid } = require('ulid');

const serviceDurationSchema = new mongoose.Schema({

    serviceDurationId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'SDU_' + ulid(),
    },
    durationMinutes: {
      type: Number,
      required: true,
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

module.exports = mongoose.model('ServiceDuration', serviceDurationSchema);
