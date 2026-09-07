const mongoose = require('mongoose');
const { ulid } = require('ulid');

const permissionSchema = new mongoose.Schema({

    permissionId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'PRM_' + ulid(),
    },
    permissionName: {
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

module.exports = mongoose.model('Permission', permissionSchema);
