const PaymentAccount = require('../models/paymentAccount');
const AuditLog = require('../models/auditLog');

// Get all payment accounts (with optional ?activeStatusId= filter)
exports.getAllPaymentAccounts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const accounts = await PaymentAccount.find(filter)
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single payment account by ID
exports.getPaymentAccountById = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id).populate('activeStatusReference');
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a payment account
exports.createPaymentAccount = async (req, res) => {
  try {
    const { accountName, activeStatusReference } = req.body;
    if (!accountName) {
      return res.status(400).json({ message: 'accountName is required' });
    }

    const account = new PaymentAccount({
      accountName,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedAccount = await account.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'paymentAccounts',
      recordReference: savedAccount._id,
    });

    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a payment account (name or activeStatusReference)
exports.updatePaymentAccount = async (req, res) => {
  try {
    const { accountName, activeStatusReference } = req.body;
    const updateData = {};
    if (accountName !== undefined) updateData.accountName = accountName;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const account = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'paymentAccounts',
      recordReference: account._id,
    });

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a payment account
exports.deletePaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'paymentAccounts',
      recordReference: account._id,
    });

    res.status(200).json({ message: 'Payment account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
