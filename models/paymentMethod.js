const mongoose = require('mongoose');
const { ulid } = require('ulid');

const paymentMethodSchema = new mongoose.Schema({

    paymentMethodId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'PMT_' + ulid(),
    },
    paymentMethodName: {
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

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
