const WorkStatus = require('../models/workStatus');
const AuditLog = require('../models/auditLog');

// Get all work statuses (with optional ?activeStatusId= filter)
exports.getAllWorkStatuses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusId = req.query.activeStatusId;
    }
    const statuses = await WorkStatus.find(filter)
      .populate('activeStatusId')
      .sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single work status by ID
exports.getWorkStatusById = async (req, res) => {
  try {
    const status = await WorkStatus.findById(req.params.id).populate('activeStatusId');
    if (!status) {
      return res.status(404).json({ message: 'Work status not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a work status
exports.createWorkStatus = async (req, res) => {
  try {
    const { statusName, activeStatusId } = req.body;
    if (!statusName) {
      return res.status(400).json({ message: 'statusName is required' });
    }

    const status = new WorkStatus({
      statusName,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedStatus = await status.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'workStatuses',
      recordId: savedStatus._id,
    });

    res.status(201).json(savedStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a work status (statusName or activeStatusId)
exports.updateWorkStatus = async (req, res) => {
  try {
    const { statusName, activeStatusId } = req.body;
    const updateData = {};
    if (statusName !== undefined) updateData.statusName = statusName;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const status = await WorkStatus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusId');

    if (!status) {
      return res.status(404).json({ message: 'Work status not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'workStatuses',
      recordId: status._id,
    });

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a work status
exports.deleteWorkStatus = async (req, res) => {
  try {
    const status = await WorkStatus.findByIdAndDelete(req.params.id);
    if (!status) {
      return res.status(404).json({ message: 'Work status not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'workStatuses',
      recordId: status._id,
    });

    res.status(200).json({ message: 'Work status deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
