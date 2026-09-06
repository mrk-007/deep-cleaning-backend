const ServiceFrequency = require('../models/serviceFrequency');
const AuditLog = require('../models/auditLog');

// Get all service frequencies (with optional ?activeStatusId= filter)
exports.getAllServiceFrequencies = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const frequencies = await ServiceFrequency.find(filter)
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });
    res.status(200).json(frequencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single service frequency by ID
exports.getServiceFrequencyById = async (req, res) => {
  try {
    const frequency = await ServiceFrequency.findById(req.params.id).populate('activeStatusReference');
    if (!frequency) {
      return res.status(404).json({ message: 'Service frequency not found' });
    }
    res.status(200).json(frequency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a service frequency
exports.createServiceFrequency = async (req, res) => {
  try {
    const { frequencyName, activeStatusReference } = req.body;
    if (!frequencyName) {
      return res.status(400).json({ message: 'frequencyName is required' });
    }

    const frequency = new ServiceFrequency({
      frequencyName,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedFrequency = await frequency.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'serviceFrequencies',
      recordReference: savedFrequency._id,
    });

    res.status(201).json(savedFrequency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a service frequency (frequencyName or activeStatusReference)
exports.updateServiceFrequency = async (req, res) => {
  try {
    const { frequencyName, activeStatusReference } = req.body;
    const updateData = {};
    if (frequencyName !== undefined) updateData.frequencyName = frequencyName;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const frequency = await ServiceFrequency.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!frequency) {
      return res.status(404).json({ message: 'Service frequency not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'serviceFrequencies',
      recordReference: frequency._id,
    });

    res.status(200).json(frequency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a service frequency
exports.deleteServiceFrequency = async (req, res) => {
  try {
    const frequency = await ServiceFrequency.findByIdAndDelete(req.params.id);
    if (!frequency) {
      return res.status(404).json({ message: 'Service frequency not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'serviceFrequencies',
      recordReference: frequency._id,
    });

    res.status(200).json({ message: 'Service frequency deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
