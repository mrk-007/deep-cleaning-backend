const mongoose = require('mongoose');
const { ulid } = require('ulid');

const bathroomCountSchema = new mongoose.Schema({

    bathroomCountId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'BTH_' + ulid(),
    },
    bathroomCount: {
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

module.exports = mongoose.model('BathroomCount', bathroomCountSchema);
