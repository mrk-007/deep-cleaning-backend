const PaymentMethod = require('../models/paymentMethod');
const AuditLog = require('../models/auditLog');

// Get all payment methods (with optional ?activeStatusId= filter)
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const paymentMethods = await PaymentMethod.find(filter)
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });
    res.status(200).json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single payment method by ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id).populate('activeStatusReference');
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.status(200).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a payment method
exports.createPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodName, activeStatusReference } = req.body;
    if (!paymentMethodName) {
      return res.status(400).json({ message: 'paymentMethodName is required' });
    }

    const paymentMethod = new PaymentMethod({
      paymentMethodName,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedPaymentMethod = await paymentMethod.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'paymentMethods',
      recordReference: savedPaymentMethod._id,
    });

    res.status(201).json(savedPaymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a payment method (name or activeStatusReference)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodName, activeStatusReference } = req.body;
    const updateData = {};
    if (paymentMethodName !== undefined) updateData.paymentMethodName = paymentMethodName;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'paymentMethods',
      recordReference: paymentMethod._id,
    });

    res.status(200).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'paymentMethods',
      recordReference: paymentMethod._id,
    });

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
