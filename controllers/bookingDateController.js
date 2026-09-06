const BookingDate = require('../models/bookingDate');
const AuditLog = require('../models/auditLog');

// Get all booking dates
exports.getAllBookingDates = async (req, res) => {
  try {
    const dates = await BookingDate.find().sort({ startDateTime: -1 });
    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking date by ID
exports.getBookingDateById = async (req, res) => {
  try {
    const date = await BookingDate.findById(req.params.id);
    if (!date) {
      return res.status(404).json({ message: 'Booking date not found' });
    }
    res.status(200).json(date);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create booking date
exports.createBookingDate = async (req, res) => {
  try {
    const { startDateTime, endDateTime } = req.body;
    if (!startDateTime) {
      return res.status(400).json({ message: 'startDateTime is required' });
    }

    const bookingDate = new BookingDate({
      startDateTime,
      endDateTime: endDateTime || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedDate = await bookingDate.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'bookingDates',
      recordReference: savedDate._id,
    });

    res.status(201).json(savedDate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking date
exports.updateBookingDate = async (req, res) => {
  try {
    const { startDateTime, endDateTime } = req.body;
    const updateData = {};
    if (startDateTime !== undefined) updateData.startDateTime = startDateTime;
    if (endDateTime !== undefined) updateData.endDateTime = endDateTime;

    const date = await BookingDate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!date) {
      return res.status(404).json({ message: 'Booking date not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'bookingDates',
      recordReference: date._id,
    });

    res.status(200).json(date);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking date
exports.deleteBookingDate = async (req, res) => {
  try {
    const date = await BookingDate.findByIdAndDelete(req.params.id);
    if (!date) {
      return res.status(404).json({ message: 'Booking date not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'bookingDates',
      recordReference: date._id,
    });

    res.status(200).json({ message: 'Booking date deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
