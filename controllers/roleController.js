const Role = require('../models/role');
const AuditLog = require('../models/auditLog');

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissionReferences')
      .populate('activeStatusReference')
      .sort({ createdAt: -1 });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissionReferences')
      .populate('activeStatusReference');
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a role
exports.createRole = async (req, res) => {
  try {
    const { roleName, permissionReferences, activeStatusReference } = req.body;
    if (!roleName) {
      return res.status(400).json({ message: 'roleName is required' });
    }

    const role = new Role({
      roleName,
      permissionReferences: permissionReferences || [],
      activeStatusReference: activeStatusReference || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedRole = await role.save();

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'roles',
      recordReference: savedRole._id,
    });

    res.status(201).json(savedRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const { roleName, permissionReferences, activeStatusReference } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { roleName, permissionReferences, activeStatusReference },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'roles',
      recordReference: role._id,
    });

    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await AuditLog.create({
      userReference: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'roles',
      recordReference: role._id,
    });

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
