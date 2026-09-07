const Role = require('../models/role');
const AuditLog = require('../models/auditLog');
const RoleLog = require('../models/auditlogs/roleLog');

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissionIds')
      .populate('activeStatusId')
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
      .populate('permissionIds')
      .populate('activeStatusId');
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
    const { roleName, permissionIds, activeStatusId } = req.body;
    if (!roleName) {
      return res.status(400).json({ message: 'roleName is required' });
    }

    const role = new Role({
      roleName,
      permissionIds: permissionIds || [],
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedRole = await role.save();

    await RoleLog.create({
      operation: 'CREATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: savedRole._id,
      details: { action: 'Role created', roleName: savedRole.roleName },
      newValue: savedRole.toObject(),
    });

    res.status(201).json(savedRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const { roleName, permissionIds, activeStatusId } = req.body;
    const previousRole = await Role.findById(req.params.id);
    if (!previousRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const updateData = {};
    if (roleName !== undefined) updateData.roleName = roleName;
    if (permissionIds !== undefined) updateData.permissionIds = permissionIds;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await RoleLog.create({
      operation: 'UPDATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: role._id,
      details: { updatedFields: Object.keys(updateData) },
      previousValue: previousRole.toObject(),
      newValue: role.toObject(),
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

    await RoleLog.create({
      operation: 'DELETE',
      actionBy: req.user ? req.user.userId : null,
      recordId: role._id,
      details: { action: 'Role deleted' },
      previousValue: role.toObject(),
      newValue: null,
    });

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
