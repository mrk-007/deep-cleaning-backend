const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customerReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    bathroomCountReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BathroomCount',
      default: null,
    },
    pricingReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pricing',
      default: null,
    },
    serviceDurationReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceDuration',
      default: null,
    },
    serviceFrequencyReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceFrequency',
      default: null,
    },
    subscriptionTypeReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionType',
      default: null,
    },
    timeSlotReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      default: null,
    },
    bookingDateReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingDate',
      default: null,
    },
    startDateTime: {
      type: Date,
      default: null,
    },
    endDateTime: {
      type: Date,
      default: null,
    },
    paymentMethodReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      default: null,
    },
    accountReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount',
      default: null,
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    workStatusReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkStatus',
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

module.exports = mongoose.model('Booking', bookingSchema);
