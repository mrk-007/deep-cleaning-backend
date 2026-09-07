const Pricing = require('../models/pricing');
const AuditLog = require('../models/auditLog');

// Get all pricing rows (supports ?isActive=true)
exports.getAllPricing = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const pricings = await Pricing.find(filter)
      .populate('serviceDurationId')
      .populate('bathroomCountId')
      .populate('activeStatusId')
      .sort({ createdAt: -1 });

    res.status(200).json(pricings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single pricing by ID
exports.getPricingById = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id)
      .populate('serviceDurationId')
      .populate('bathroomCountId')
      .populate('activeStatusId');

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing record not found' });
    }
    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create pricing record (and optionally deactivate older row for same duration + bathroom count)
exports.createPricing = async (req, res) => {
  try {
    const {
      serviceDurationId,
      bathroomCountId,
      price,
      effectiveFrom,
      activeStatusId,
      deactivatePrevious,
    } = req.body;

    if (!serviceDurationId || !bathroomCountId || price === undefined) {
      return res.status(400).json({
        message: 'serviceDurationId, bathroomCountId, and price are required',
      });
    }

    // If updating price by creating a new row, optionally deactivate previous active row
    if (deactivatePrevious) {
      await Pricing.updateMany(
        {
          serviceDurationId,
          bathroomCountId,
          isActive: true,
        },
        { isActive: false }
      );
    }

    const pricing = new Pricing({
      serviceDurationId,
      bathroomCountId,
      price,
      isActive: true,
      effectiveFrom: effectiveFrom || new Date(),
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });

    const savedPricing = await pricing.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'pricing',
      recordId: savedPricing._id,
    });

    res.status(201).json(savedPricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update pricing (e.g. deactivate or modify)
exports.updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('serviceDurationId')
      .populate('bathroomCountId')
      .populate('activeStatusId');

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing record not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'pricing',
      recordId: pricing._id,
    });

    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete pricing
exports.deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing record not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'pricing',
      recordId: pricing._id,
    });

    res.status(200).json({ message: 'Pricing record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
