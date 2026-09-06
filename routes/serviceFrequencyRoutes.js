const express = require('express');
const router = express.Router();
const serviceFrequencyController = require('../controllers/serviceFrequencyController');
const auth = require('../middleware/auth');

router.get('/', serviceFrequencyController.getAllServiceFrequencies);
router.get('/:id', serviceFrequencyController.getServiceFrequencyById);
router.post('/', auth, serviceFrequencyController.createServiceFrequency);
router.put('/:id', auth, serviceFrequencyController.updateServiceFrequency);
router.delete('/:id', auth, serviceFrequencyController.deleteServiceFrequency);

module.exports = router;
