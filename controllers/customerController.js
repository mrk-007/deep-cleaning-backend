const Customer = require('../models/customer');
const AuditLog = require('../models/auditLog');
const CustomerLog = require('../models/auditlogs/customerLog');

// Get all customers (with optional search filter)
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { apartmentName: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const customers = await Customer.find(query)
      .populate('activeStatusId')
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('activeStatusId');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      address,
      doorNo,
      block,
      apartmentName,
      landmark,
      city,
      pincode,
      activeStatusId,
    } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ message: 'name and phoneNumber are required' });
    }

    const customer = new Customer({
      name,
      phoneNumber,
      address: address || '',
      doorNo: doorNo || '',
      block: block || '',
      apartmentName: apartmentName || '',
      landmark: landmark || '',
      city: city || '',
      pincode: pincode || '',
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });

    const savedCustomer = await customer.save();

    await CustomerLog.create({
      operation: 'CREATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: savedCustomer._id,
      details: { action: 'Customer created', name: savedCustomer.name, phoneNumber: savedCustomer.phoneNumber },
      newValue: savedCustomer.toObject(),
    });

    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const previousCustomer = await Customer.findById(req.params.id);
    if (!previousCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('activeStatusId');

    await CustomerLog.create({
      operation: 'UPDATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: customer._id,
      details: { updatedFields: Object.keys(req.body) },
      previousValue: previousCustomer.toObject(),
      newValue: customer.toObject(),
    });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await CustomerLog.create({
      operation: 'DELETE',
      actionBy: req.user ? req.user.userId : null,
      recordId: customer._id,
      details: { action: 'Customer deleted' },
      previousValue: customer.toObject(),
      newValue: null,
    });

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
