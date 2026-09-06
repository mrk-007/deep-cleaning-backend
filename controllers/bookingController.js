const Booking = require('../models/booking');
const Invoice = require('../models/invoice');
const Counter = require('../models/counter');
const AuditLog = require('../models/auditLog');
const BookingDate = require('../models/bookingDate');

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

    if (customerId) filter.customerReference = customerId;
    if (workStatusId) filter.workStatusReference = workStatusId;
    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) filter.startDateTime.$gte = new Date(startDate);
      if (endDate) filter.startDateTime.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('customerReference')
      .populate('bathroomCountReference')
      .populate('pricingReference')
      .populate('serviceDurationReference')
      .populate('serviceFrequencyReference')
      .populate('subscriptionTypeReference')
      .populate('timeSlotReference')
      .populate('bookingDateReference')
      .populate('paymentMethodReference')
      .populate('accountReference')
      .populate('workStatusReference')
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
      .populate('customerReference')
      .populate('bathroomCountReference')
      .populate('pricingReference')
      .populate('serviceDurationReference')
      .populate('serviceFrequencyReference')
      .populate('subscriptionTypeReference')
      .populate('timeSlotReference')
      .populate('bookingDateReference')
      .populate('paymentMethodReference')
      .populate('accountReference')
      .populate('workStatusReference');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const invoice = await Invoice.findOne({ bookingReference: booking._id });

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
      customerReference,
      bathroomCountReference,
      pricingReference,
      serviceDurationReference,
      serviceFrequencyReference,
      subscriptionTypeReference,
      timeSlotReference,
      bookingDateReference,
      startDateTime,
      endDateTime,
      paymentMethodReference,
      accountReference,
      transactionId,
      amount,
      workStatusReference,
    } = req.body;

    if (!customerReference || (!startDateTime && !bookingDateReference) || amount === undefined || amount === null) {
      return res.status(400).json({
        message: 'customerReference, (startDateTime or bookingDateReference), and amount are required',
      });
    }

    const userId = req.user ? req.user.userId : null;

    let resolvedBookingDateRef = bookingDateReference || null;
    let resolvedStartDateTime = startDateTime || null;
    let resolvedEndDateTime = endDateTime || null;

    // If startDateTime is provided but no bookingDateReference, auto-create BookingDate
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

    // 1. Create booking record
    const booking = new Booking({
      customerReference,
      bathroomCountReference: bathroomCountReference || null,
      pricingReference: pricingReference || null,
      serviceDurationReference: serviceDurationReference || null,
      serviceFrequencyReference: serviceFrequencyReference || null,
      subscriptionTypeReference: subscriptionTypeReference || null,
      timeSlotReference: timeSlotReference || null,
      bookingDateReference: resolvedBookingDateRef,
      startDateTime: resolvedStartDateTime,
      endDateTime: resolvedEndDateTime,
      paymentMethodReference: paymentMethodReference || null,
      accountReference: accountReference || null,
      transactionId: transactionId || '',
      amount,
      workStatusReference: workStatusReference || null,
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
      customerReference,
      bookingReference: savedBooking._id,
      amount: savedBooking.amount,
      createdBy: userId,
    });

    const savedInvoice = await invoice.save();

    // 4. Record audit logs
    await AuditLog.create([
      {
        userReference: userId,
        operation: 'create',
        collectionName: 'bookings',
        recordReference: savedBooking._id,
      },
      {
        userReference: userId,
        operation: 'create',
        collectionName: 'invoices',
        recordReference: savedInvoice._id,
      },
    ]);

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
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customerReference')
      .populate('bathroomCountReference')
      .populate('pricingReference')
      .populate('serviceDurationReference')
      .populate('serviceFrequencyReference')
      .populate('subscriptionTypeReference')
      .populate('timeSlotReference')
      .populate('bookingDateReference')
      .populate('paymentMethodReference')
      .populate('accountReference')
      .populate('workStatusReference');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'bookings',
      recordReference: booking._id,
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
    await Invoice.findOneAndDelete({ bookingReference: booking._id });

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'bookings',
      recordReference: booking._id,
    });

    res.status(200).json({ message: 'Booking and associated invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
