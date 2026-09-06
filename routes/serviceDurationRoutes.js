const express = require('express');
const router = express.Router();
const serviceDurationController = require('../controllers/serviceDurationController');
const auth = require('../middleware/auth');

router.get('/', serviceDurationController.getAllServiceDurations);
router.get('/:id', serviceDurationController.getServiceDurationById);
router.post('/', auth, serviceDurationController.createServiceDuration);
router.put('/:id', auth, serviceDurationController.updateServiceDuration);
router.delete('/:id', auth, serviceDurationController.deleteServiceDuration);

module.exports = router;
