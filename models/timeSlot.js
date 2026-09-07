const mongoose = require('mongoose');
const { ulid } = require('ulid');

const timeSlotSchema = new mongoose.Schema({

    timeSlotId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'TSL_' + ulid(),
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    bufferTime: {
      type: Number,
      default: 0, // in minutes
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

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
