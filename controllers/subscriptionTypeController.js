const SubscriptionType = require('../models/subscriptionType');
const AuditLog = require('../models/auditLog');

// Get all subscription types (with optional ?activeStatusId= filter)
exports.getAllSubscriptionTypes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusReference = req.query.activeStatusId;
    }
    const subscriptions = await SubscriptionType.find(filter)
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single subscription type by ID
exports.getSubscriptionTypeById = async (req, res) => {
  try {
    const subscription = await SubscriptionType.findById(req.params.id).populate('activeStatusReference');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a subscription type
exports.createSubscriptionType = async (req, res) => {
  try {
    const { subscriptionName, activeStatusReference } = req.body;
    if (!subscriptionName) {
      return res.status(400).json({ message: 'subscriptionName is required' });
    }

    const subscription = new SubscriptionType({
      subscriptionName,
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedSubscription = await subscription.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'subscriptionTypes',
      recordReference: savedSubscription._id,
    });

    res.status(201).json(savedSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a subscription type (subscriptionName or activeStatusReference)
exports.updateSubscriptionType = async (req, res) => {
  try {
    const { subscriptionName, activeStatusReference } = req.body;
    const updateData = {};
    if (subscriptionName !== undefined) updateData.subscriptionName = subscriptionName;
    if (activeStatusReference !== undefined) updateData.activeStatusReference = activeStatusReference;

    const subscription = await SubscriptionType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusReference');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'subscriptionTypes',
      recordReference: subscription._id,
    });

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a subscription type
exports.deleteSubscriptionType = async (req, res) => {
  try {
    const subscription = await SubscriptionType.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'subscriptionTypes',
      recordReference: subscription._id,
    });

    res.status(200).json({ message: 'Subscription type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
