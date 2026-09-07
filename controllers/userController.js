const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const UserLog = require('../models/auditlogs/userLog');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .populate({
        path: 'roleId',
        populate: { path: 'permissionIds' },
      })
      .populate('activeStatusId')
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate({
        path: 'roleId',
        populate: { path: 'permissionIds' },
      })
      .populate('activeStatusId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register / Create user
exports.createUser = async (req, res) => {
  try {
    const { userName, email, password, roleId, activeStatusId } = req.body;
    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'userName, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      userName,
      email: email.toLowerCase().trim(),
      passwordHash,
      roleId: roleId || null,
      activeStatusId: activeStatusId || null,
      createdBy: req.user ? req.user.userId : null,
    });
    const savedUser = await user.save();

    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;

    await UserLog.create({
      operation: 'CREATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: savedUser._id,
      details: { action: 'User registered', email: savedUser.email },
      newValue: userResponse,
    });

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('roleId')
      .populate('activeStatusId');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        email: user.email,
        role: user.roleId ? user.roleId.roleName : null,
      },
      process.env.JWT_SECRET || 'supersecretjwtkey_jolly_home_needs_2026',
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { userName, email, password, roleId, activeStatusId } = req.body;
    const updateData = {};

    if (userName) updateData.userName = userName;
    if (email) updateData.email = email.toLowerCase().trim();
    if (roleId !== undefined) updateData.roleId = roleId;
    if (activeStatusId !== undefined) updateData.activeStatusId = activeStatusId;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const previousUser = await User.findById(req.params.id).select('-passwordHash');
    if (!previousUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select('-passwordHash')
      .populate('roleId')
      .populate('activeStatusId');

    await UserLog.create({
      operation: 'UPDATE',
      actionBy: req.user ? req.user.userId : null,
      recordId: user._id,
      details: { updatedFields: Object.keys(updateData).filter((k) => k !== 'passwordHash') },
      previousValue: previousUser.toObject(),
      newValue: user.toObject(),
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserLog.create({
      operation: 'DELETE',
      actionBy: req.user ? req.user.userId : null,
      recordId: user._id,
      details: { action: 'User deleted' },
      previousValue: user.toObject(),
      newValue: null,
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
