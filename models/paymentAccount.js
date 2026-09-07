const mongoose = require('mongoose');
const { ulid } = require('ulid');

const paymentAccountSchema = new mongoose.Schema({

    paymentAccountId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'PAC_' + ulid(),
    },
    accountName: {
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

module.exports = mongoose.model('PaymentAccount', paymentAccountSchema);
