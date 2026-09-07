const SubscriptionType = require('../models/subscriptionType');
const AuditLog = require('../models/auditLog');
const SubscriptionLog = require('../models/auditlogs/subscriptionLog');

// Get all subscription types (with optional ?activeStatusId= filter)
exports.getAllSubscriptionTypes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeStatusId) {
      filter.activeStatusId = req.query.activeStatusId;
    }
    const subscriptions = await SubscriptionType.find(filter)
      .populate('activeStatusId')
      .sort({ createdAt: -1 });
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single subscription type by ID
exports.getSubscriptionTypeById = async (req, res) => {
  try {
    const subscription = await SubscriptionType.findById(req.params.id).populate('activeStatusId');
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
    const { subscriptionName, activeStatusId } = req.body;
    if (!subscriptionName) {
      return res.status(400).json({ message: 'subscriptionName is required' });
    }

    const subscription = new SubscriptionType({
      subscriptionName,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedSubscription = await subscription.save();

    await SubscriptionLog.create({
      operation: 'CREATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: savedSubscription._id,
      details: { action: 'Subscription plan created', subscriptionName: savedSubscription.subscriptionName },
      newValue: savedSubscription.toObject(),
    });

    res.status(201).json(savedSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a subscription type (subscriptionName or activeStatusId)
exports.updateSubscriptionType = async (req, res) => {
  try {
    const { subscriptionName, activeStatusId } = req.body;
    const previousSub = await SubscriptionType.findById(req.params.id);
    if (!previousSub) {
      return res.status(404).json({ message: 'Subscription type not found' });
    }

    const updateData = {};
    if (subscriptionName !== undefined) updateData.subscriptionName = subscriptionName;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const subscription = await SubscriptionType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusId');

    await SubscriptionLog.create({
      operation: 'UPDATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: subscription._id,
      details: { updatedFields: Object.keys(updateData) },
      previousValue: previousSub.toObject(),
      newValue: subscription.toObject(),
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

    await SubscriptionLog.create({
      operation: 'DELETE',
      actionBy: req.user ? req.user.userId : null,
      recordId: subscription._id,
      details: { action: 'Subscription plan deleted' },
      previousValue: subscription.toObject(),
      newValue: null,
    });

    res.status(200).json({ message: 'Subscription type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
