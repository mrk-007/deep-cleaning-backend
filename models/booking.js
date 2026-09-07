const mongoose = require('mongoose');
const { ulid } = require('ulid');

const bookingSchema = new mongoose.Schema({

    bookingId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'BKG_' + ulid(),
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    bathroomCountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BathroomCount',
      default: null,
    },
    pricingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pricing',
      default: null,
    },
    serviceDurationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceDuration',
      default: null,
    },
    serviceFrequencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceFrequency',
      default: null,
    },
    subscriptionTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionType',
      default: null,
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      default: null,
    },
    bookingDateId: {
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
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      default: null,
    },
    paymentAccountId: {
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
    workStatusId: {
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
