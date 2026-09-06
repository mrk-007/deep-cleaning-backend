const express = require('express');
const router = express.Router();
const activeStatusController = require('../controllers/activeStatusController');
const auth = require('../middleware/auth');

router.get('/', activeStatusController.getAllActiveStatuses);
router.get('/:id', activeStatusController.getActiveStatusById);
router.post('/', auth, activeStatusController.createActiveStatus);
router.put('/:id', auth, activeStatusController.updateActiveStatus);
router.delete('/:id', auth, activeStatusController.deleteActiveStatus);

module.exports = router;
