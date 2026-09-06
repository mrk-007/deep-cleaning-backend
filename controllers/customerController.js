const Customer = require('../models/customer');
const AuditLog = require('../models/auditLog');

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
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('activeStatusReference');
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
      activeStatusReference,
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
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });

    const savedCustomer = await customer.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'customers',
      recordReference: savedCustomer._id,
    });

    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('activeStatusReference');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'customers',
      recordReference: customer._id,
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

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'customers',
      recordReference: customer._id,
    });

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
