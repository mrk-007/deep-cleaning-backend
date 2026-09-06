const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const auth = require('../middleware/auth');

router.get('/', permissionController.getAllPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', auth, permissionController.createPermission);
router.put('/:id', auth, permissionController.updatePermission);
router.delete('/:id', auth, permissionController.deletePermission);

module.exports = router;
