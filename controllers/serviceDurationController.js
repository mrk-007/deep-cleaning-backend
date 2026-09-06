const ServiceDuration = require('../models/serviceDuration');
const AuditLog = require('../models/auditLog');

// Get all service durations (with optional ?activeStatusId= filter)
exports.getAllServiceDurations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const durations = await ServiceDuration.find(filter)
      .populate('activeStatusReference')
      .sort({ durationMinutes: 1 });
    res.status(200).json(durations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single duration by ID
exports.getServiceDurationById = async (req, res) => {
  try {
    const duration = await ServiceDuration.findById(req.params.id).populate('activeStatusReference');
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
    const { durationMinutes, activeStatusReference } = req.body;
    if (durationMinutes === undefined || durationMinutes === null) {
      return res.status(400).json({ message: 'durationMinutes is required' });
    }

    const duration = new ServiceDuration({
      durationMinutes,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedDuration = await duration.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'serviceDurations',
      recordReference: savedDuration._id,
    });

    res.status(201).json(savedDuration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a service duration (durationMinutes or activeStatusReference)
exports.updateServiceDuration = async (req, res) => {
  try {
    const { durationMinutes, activeStatusReference } = req.body;
    const updateData = {};
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const duration = await ServiceDuration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!duration) {
      return res.status(404).json({ message: 'Service duration not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'serviceDurations',
      recordReference: duration._id,
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
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'serviceDurations',
      recordReference: duration._id,
    });

    res.status(200).json({ message: 'Service duration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
