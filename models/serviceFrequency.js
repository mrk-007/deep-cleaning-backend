const mongoose = require('mongoose');
const { ulid } = require('ulid');

const serviceFrequencySchema = new mongoose.Schema({

    serviceFrequencyId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'SFR_' + ulid(),
    },
    frequencyName: {
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

module.exports = mongoose.model('ServiceFrequency', serviceFrequencySchema);
