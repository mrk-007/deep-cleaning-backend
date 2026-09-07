const ActiveStatus = require('../models/activeStatus');
const AuditLog = require('../models/auditLog');

// Get all active statuses
exports.getAllActiveStatuses = async (req, res) => {
  try {
    const statuses = await ActiveStatus.find().sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single active status by ID
exports.getActiveStatusById = async (req, res) => {
  try {
    const status = await ActiveStatus.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ message: 'Active status not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create an active status
exports.createActiveStatus = async (req, res) => {
  try {
    const { activeStatusName } = req.body;
    if (!activeStatusName) {
      return res.status(400).json({ message: 'activeStatusName is required' });
    }

    const status = new ActiveStatus({
      activeStatusName,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedStatus = await status.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'activeStatuses',
      recordId: savedStatus._id,
    });

    res.status(201).json(savedStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an active status
exports.updateActiveStatus = async (req, res) => {
  try {
    const { activeStatusName } = req.body;
    const status = await ActiveStatus.findByIdAndUpdate(
      req.params.id,
      { activeStatusName },
      { new: true, runValidators: true }
    );

    if (!status) {
      return res.status(404).json({ message: 'Active status not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'activeStatuses',
      recordId: status._id,
    });

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an active status
exports.deleteActiveStatus = async (req, res) => {
  try {
    const status = await ActiveStatus.findByIdAndDelete(req.params.id);
    if (!status) {
      return res.status(404).json({ message: 'Active status not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'activeStatuses',
      recordId: status._id,
    });

    res.status(200).json({ message: 'Active status deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
