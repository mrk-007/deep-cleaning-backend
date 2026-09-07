const mongoose = require('mongoose');
const { ulid } = require('ulid');

const bookingDateSchema = new mongoose.Schema({

    bookingDateId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'BDT_' + ulid(),
    },
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
