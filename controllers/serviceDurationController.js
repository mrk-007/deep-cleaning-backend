const ServiceDuration = require('../models/serviceDuration');
const AuditLog = require('../models/auditLog');

// Get all service durations (with optional ?activeStatusId= filter)
exports.getAllServiceDurations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusId = req.query.activeStatusId;
    }
    const durations = await ServiceDuration.find(filter)
      .populate('activeStatusId')
      .sort({ durationMinutes: 1 });
    res.status(200).json(durations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single duration by ID
exports.getServiceDurationById = async (req, res) => {
  try {
    const duration = await ServiceDuration.findById(req.params.id).populate('activeStatusId');
    if (!duration) {
      return res.status(404).json({ message: 'Service duration not found' });
    }
    res.status(200).json(duration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a service duration
exports.createServiceDuration = async (req, res) => {
  try {
    const { durationMinutes, activeStatusId } = req.body;
    if (durationMinutes === undefined || durationMinutes === null) {
      return res.status(400).json({ message: 'durationMinutes is required' });
    }

    const duration = new ServiceDuration({
      durationMinutes,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedDuration = await duration.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'serviceDurations',
      recordId: savedDuration._id,
    });

    res.status(201).json(savedDuration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a service duration (durationMinutes or activeStatusId)
exports.updateServiceDuration = async (req, res) => {
  try {
    const { durationMinutes, activeStatusId } = req.body;
    const updateData = {};
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const duration = await ServiceDuration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusId');

    if (!duration) {
      return res.status(404).json({ message: 'Service duration not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'serviceDurations',
      recordId: duration._id,
    });

    res.status(200).json(duration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a service duration
exports.deleteServiceDuration = async (req, res) => {
  try {
    const duration = await ServiceDuration.findByIdAndDelete(req.params.id);
    if (!duration) {
      return res.status(404).json({ message: 'Service duration not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'serviceDurations',
      recordId: duration._id,
    });

    res.status(200).json({ message: 'Service duration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
