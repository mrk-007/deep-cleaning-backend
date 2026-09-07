const mongoose = require('mongoose');
const { ulid } = require('ulid');

const workStatusSchema = new mongoose.Schema({

    workStatusId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'WST_' + ulid(),
    },
    statusName: {
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

module.exports = mongoose.model('WorkStatus', workStatusSchema);
