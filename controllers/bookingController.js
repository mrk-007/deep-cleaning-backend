const Booking = require('../models/booking');
const Invoice = require('../models/invoice');
const Counter = require('../models/counter');
const AuditLog = require('../models/auditLog');
const BookingDate = require('../models/bookingDate');
const WorkStatus = require('../models/workStatus');
const BookingLog = require('../models/auditlogs/bookingLog');

// Helper to format date string YYYYMMDD
const getDateKey = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

// Get all bookings (with optional filters)
exports.getAllBookings = async (req, res) => {
  try {
    const { customerId, workStatusId, startDate, endDate } = req.query;
    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (workStatusId) filter.workStatusId = workStatusId;
    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) filter.startDateTime.$gte = new Date(startDate);
      if (endDate) filter.startDateTime.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('customerId')
      .populate('bathroomCountId')
      .populate('pricingId')
      .populate('serviceDurationId')
      .populate('serviceFrequencyId')
      .populate('subscriptionTypeId')
      .populate('timeSlotId')
      .populate('bookingDateId')
      .populate('paymentMethodId')
      .populate('paymentAccountId')
      .populate('workStatusId')
      .sort({ startDateTime: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking by ID (including generated invoice)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId')
      .populate('bathroomCountId')
      .populate('pricingId')
      .populate('serviceDurationId')
      .populate('serviceFrequencyId')
      .populate('subscriptionTypeId')
      .populate('timeSlotId')
      .populate('bookingDateId')
      .populate('paymentMethodId')
      .populate('paymentAccountId')
      .populate('workStatusId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const invoice = await Invoice.findOne({ bookingId: booking._id });

    res.status(200).json({
      booking,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a booking & auto-generate invoice in one shot
exports.createBooking = async (req, res) => {
  try {
    const {
      customerId,
      bathroomCountId,
      pricingId,
      serviceDurationId,
      serviceFrequencyId,
      subscriptionTypeId,
      timeSlotId,
      bookingDateId,
      startDateTime,
      endDateTime,
      paymentMethodId,
      paymentAccountId,
      transactionId,
      amount,
      workStatusId,
    } = req.body;

    if (!customerId || (!startDateTime && !bookingDateId) || amount === undefined || amount === null) {
      return res.status(400).json({
        message: 'customerId, (startDateTime or bookingDateId), and amount are required',
      });
    }

    const userId = req.user ? req.user.userId : null;

    let resolvedBookingDateRef = bookingDateId || null;
    let resolvedStartDateTime = startDateTime || null;
    let resolvedEndDateTime = endDateTime || null;

    // If startDateTime is provided but no bookingDateId, auto-create BookingDate
    if (!resolvedBookingDateRef && startDateTime) {
      const newBookingDate = new BookingDate({
        startDateTime,
        endDateTime: endDateTime || null,
        createdBy: userId,
      });
      const savedDate = await newBookingDate.save();
      resolvedBookingDateRef = savedDate._id;
    } else if (resolvedBookingDateRef && !resolvedStartDateTime) {
      const dateDoc = await BookingDate.findById(resolvedBookingDateRef);
      if (dateDoc) {
        resolvedStartDateTime = dateDoc.startDateTime;
        resolvedEndDateTime = dateDoc.endDateTime;
      }
    }

    // Prevent overlapping bookings: check for conflict on this date & time slot
    if (resolvedStartDateTime) {
      const targetStart = new Date(resolvedStartDateTime);
      const targetEnd = resolvedEndDateTime
        ? new Date(resolvedEndDateTime)
        : new Date(targetStart.getTime() + 60 * 60 * 1000);

      const dayStart = new Date(targetStart);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(targetStart);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const existingBookings = await Booking.find({
        startDateTime: { $gte: dayStart, $lte: dayEnd },
      }).populate('workStatusId');

      const isConflicting = existingBookings.some((b) => {
        if (b.workStatusId && b.workStatusId.statusName && b.workStatusId.statusName.toLowerCase() === 'cancelled') {
          return false;
        }
        if (timeSlotId && b.timeSlotId && String(b.timeSlotId) === String(timeSlotId)) {
          return true;
        }
        if (b.startDateTime) {
          const bStart = new Date(b.startDateTime);
          const bEnd = b.endDateTime ? new Date(b.endDateTime) : new Date(bStart.getTime() + 60 * 60 * 1000);
          return targetStart < bEnd && targetEnd > bStart;
        }
        return false;
      });

      if (isConflicting) {
        return res.status(409).json({
          message: 'The selected date and time slot is already booked. Please choose another slot.',
        });
      }
    }

    // 1. Create booking record
    const booking = new Booking({
      customerId,
      bathroomCountId: bathroomCountId || null,
      pricingId: pricingId || null,
      serviceDurationId: serviceDurationId || null,
      serviceFrequencyId: serviceFrequencyId || null,
      subscriptionTypeId: subscriptionTypeId || null,
      timeSlotId: timeSlotId || null,
      bookingDateId: resolvedBookingDateRef,
      startDateTime: resolvedStartDateTime,
      endDateTime: resolvedEndDateTime,
      paymentMethodId: paymentMethodId || null,
      paymentAccountId: paymentAccountId || null,
      transactionId: transactionId || '',
      amount,
      workStatusId: workStatusId || null,
      createdBy: userId,
    });

    const savedBooking = await booking.save();

    // 2. Generate sequential invoice number atomically
    const dateKey = getDateKey();
    const counterId = `invoice-${dateKey}`;

    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const seqPadded = String(counter.seq).padStart(4, '0');
    const invoiceNumber = `JHN${dateKey}-${seqPadded}`;

    // 3. Create invoice record
    const invoice = new Invoice({
      invoiceNumber,
      customerId,
      bookingId: savedBooking._id,
      amount: savedBooking.amount,
      createdBy: userId,
    });

    const savedInvoice = await invoice.save();

    // 4. Record audit log
    await BookingLog.create({
      operation: 'CREATE',
      actionBy: userId,
      recordId: savedBooking._id,
      details: {
        action: 'Booking created and invoice generated',
        invoiceNumber: savedInvoice.invoiceNumber,
        amount: savedBooking.amount,
      },
      newValue: savedBooking.toObject(),
    });

    res.status(201).json({
      message: 'Booking created and invoice generated successfully',
      booking: savedBooking,
      invoice: savedInvoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    const previousBooking = await Booking.findById(req.params.id);
    if (!previousBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customerId')
      .populate('bathroomCountId')
      .populate('pricingId')
      .populate('serviceDurationId')
      .populate('serviceFrequencyId')
      .populate('subscriptionTypeId')
      .populate('timeSlotId')
      .populate('bookingDateId')
      .populate('paymentMethodId')
      .populate('paymentAccountId')
      .populate('workStatusId');

    await BookingLog.create({
      operation: 'UPDATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: booking._id,
      details: { updatedFields: Object.keys(req.body) },
      previousValue: previousBooking.toObject(),
      newValue: booking.toObject(),
    });

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Also remove associated invoice
    await Invoice.findOneAndDelete({ bookingId: booking._id });

    await BookingLog.create({
      operation: 'DELETE',
      actionBy: req.user ? req.user.userId : null,
      recordId: booking._id,
      details: { action: 'Booking and associated invoice deleted' },
      previousValue: booking.toObject(),
      newValue: null,
    });

    res.status(200).json({ message: 'Booking and associated invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
