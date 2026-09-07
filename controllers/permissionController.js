const Permission = require('../models/permission');
const AuditLog = require('../models/auditLog');

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single permission by ID
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new permission
exports.createPermission = async (req, res) => {
  try {
    const { permissionName } = req.body;
    if (!permissionName) {
      return res.status(400).json({ message: 'permissionName is required' });
    }

    const permission = new Permission({
      permissionName,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedPermission = await permission.save();

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'create',
      collectionName: 'permissions',
      recordId: savedPermission._id,
    });

    res.status(201).json(savedPermission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a permission
exports.updatePermission = async (req, res) => {
  try {
    const { permissionName } = req.body;
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { permissionName },
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'update',
      collectionName: 'permissions',
      recordId: permission._id,
    });

    res.status(200).json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a permission
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await AuditLog.create({
      actionBy: req.user ? req.user.userId : null,
      operation: 'delete',
      collectionName: 'permissions',
      recordId: permission._id,
    });

    res.status(200).json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
