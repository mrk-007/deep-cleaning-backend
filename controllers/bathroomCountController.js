const BathroomCount = require('../models/bathroomCount');
const AuditLog = require('../models/auditLog');

// Get all bathroom counts (with optional ?activeStatusId= filter)
exports.getAllBathroomCounts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const counts = await BathroomCount.find(filter)
      .populate('activeStatusReference')
      .sort({ bathroomCount: 1 });
    res.status(200).json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single bathroom count by ID
exports.getBathroomCountById = async (req, res) => {
  try {
    const count = await BathroomCount.findById(req.params.id).populate('activeStatusReference');
    if (!count) {
      return res.status(404).json({ message: 'Bathroom count not found' });
    }
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a bathroom count
exports.createBathroomCount = async (req, res) => {
  try {
    const { bathroomCount, activeStatusReference } = req.body;
    if (bathroomCount === undefined || bathroomCount === null) {
      return res.status(400).json({ message: 'bathroomCount is required' });
    }

    const newCount = new BathroomCount({
      bathroomCount,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedCount = await newCount.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'bathroomCounts',
      recordReference: savedCount._id,
    });

    res.status(201).json(savedCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a bathroom count (count or activeStatusReference)
exports.updateBathroomCount = async (req, res) => {
  try {
    const { bathroomCount, activeStatusReference } = req.body;
    const updateData = {};
    if (bathroomCount !== undefined) updateData.bathroomCount = bathroomCount;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const count = await BathroomCount.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!count) {
      return res.status(404).json({ message: 'Bathroom count not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'bathroomCounts',
      recordReference: count._id,
    });

    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a bathroom count
exports.deleteBathroomCount = async (req, res) => {
  try {
    const count = await BathroomCount.findByIdAndDelete(req.params.id);
    if (!count) {
      return res.status(404).json({ message: 'Bathroom count not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'bathroomCounts',
      recordReference: count._id,
    });

    res.status(200).json({ message: 'Bathroom count deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
