const Invoice = require('../models/invoice');
const AuditLog = require('../models/auditLog');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { customerId, bookingId } = req.query;
    const filter = {};

    if (customerId) filter.customerReference = customerId;
    if (bookingId) filter.bookingReference = bookingId;

    const invoices = await Invoice.find(filter)
      .populate('customerReference')
      .populate('bookingReference')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerReference')
      .populate('bookingReference');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice by booking ID
exports.getInvoiceByBookingId = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ bookingReference: req.params.bookingId })
      .populate('customerReference')
      .populate('bookingReference');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this booking' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create an invoice manually (if needed)
exports.createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, customerReference, bookingReference, amount } = req.body;
    if (!invoiceNumber || !customerReference || !bookingReference || amount === undefined) {
      return res.status(400).json({
        message: 'invoiceNumber, customerReference, bookingReference, and amount are required',
      });
    }

    const invoice = new Invoice({
      invoiceNumber,
      customerReference,
      bookingReference,
      amount,
      createdBy: req.user ? req.user.userId : null,
    });

    const savedInvoice = await invoice.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'invoices',
      recordReference: savedInvoice._id,
    });

    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'invoices',
      recordReference: invoice._id,
    });

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
