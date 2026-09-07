const TimeSlot = require('../models/timeSlot');
const AuditLog = require('../models/auditLog');

// Get dynamic available time slots (calculated by availability middleware)
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    if (!req.availabilityData) {
      return res.status(500).json({ message: 'Availability data not found' });
    }
    res.status(200).json(req.availabilityData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all time slots
exports.getAllTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find()
      .populate('activeStatusId')
      .sort({ startTime: 1 });
    res.status(200).json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single time slot by ID
exports.getTimeSlotById = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id).populate('activeStatusId');
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.status(200).json(timeSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a time slot
exports.createTimeSlot = async (req, res) => {
  try {
    const { startTime, endTime, bufferTime, activeStatusId } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'startTime and endTime are required' });
    }

    const timeSlot = new TimeSlot({
      startTime,
      endTime,
      bufferTime: bufferTime || 0,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedTimeSlot = await timeSlot.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'timeSlots',
      recordId: savedTimeSlot._id,
    });

    res.status(201).json(savedTimeSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a time slot
exports.updateTimeSlot = async (req, res) => {
  try {
    const { startTime, endTime, bufferTime, activeStatusId } = req.body;
    const updateData = {};
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (bufferTime !== undefined) updateData.bufferTime = bufferTime;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const timeSlot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activeStatusId');

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'timeSlots',
      recordId: timeSlot._id,
    });

    res.status(200).json(timeSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a time slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'timeSlots',
      recordId: timeSlot._id,
    });

    res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
