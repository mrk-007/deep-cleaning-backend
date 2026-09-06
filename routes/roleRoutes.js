const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', auth, roleController.createRole);
router.put('/:id', auth, roleController.updateRole);
router.delete('/:id', auth, roleController.deleteRole);

module.exports = router;
