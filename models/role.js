const mongoose = require('mongoose');
const { ulid } = require('ulid');

const roleSchema = new mongoose.Schema({

    roleId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'ROL_' + ulid(),
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    permissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
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

module.exports = mongoose.model('Role', roleSchema);
