const mongoose = require('mongoose');

const bookingDateSchema = new mongoose.Schema(
  {
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
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

module.exports = mongoose.model('BookingDate', bookingDateSchema);
