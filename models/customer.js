const mongoose = require('mongoose');
const { ulid } = require('ulid');

const customerSchema = new mongoose.Schema({

    customerId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'CUS_' + ulid(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    doorNo: {
      type: String,
      trim: true,
      default: '',
    },
    block: {
      type: String,
      trim: true,
      default: '',
    },
    apartmentName: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
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

module.exports = mongoose.model('Customer', customerSchema);
