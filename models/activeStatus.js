const mongoose = require('mongoose');
const { ulid } = require('ulid');

const activeStatusSchema = new mongoose.Schema({

    activeStatusId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'AST_' + ulid(),
    },
    activeStatusName: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActiveStatus', activeStatusSchema);
