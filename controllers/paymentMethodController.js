const PaymentMethod = require('../models/paymentMethod');
const AuditLog = require('../models/auditLog');

// Get all payment methods (with optional ?activeStatusId= filter)
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusId = req.query.activeStatusId;
    }
    const paymentMethods = await PaymentMethod.find(filter)
      .populate('activeStatusId')
      .sort({ createdAt: -1 });
    res.status(200).json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single payment method by ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id).populate('activeStatusId');
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
    const { paymentMethodName, activeStatusId } = req.body;
    if (!paymentMethodName) {
      return res.status(400).json({ message: 'paymentMethodName is required' });
    }

    const paymentMethod = new PaymentMethod({
      paymentMethodName,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedPaymentMethod = await paymentMethod.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'paymentMethods',
      recordId: savedPaymentMethod._id,
    });

    res.status(201).json(savedPaymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a payment method (name or activeStatusId)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodName, activeStatusId } = req.body;
    const updateData = {};
    if (paymentMethodName !== undefined) updateData.paymentMethodName = paymentMethodName;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusId');

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'paymentMethods',
      recordId: paymentMethod._id,
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
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'paymentMethods',
      recordId: paymentMethod._id,
    });

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
