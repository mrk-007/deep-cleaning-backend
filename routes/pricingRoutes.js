const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const auth = require('../middleware/auth');

router.get('/', auth, pricingController.getAllPricing);
router.get('/:id', auth, pricingController.getPricingById);
router.post('/', auth, pricingController.createPricing);
router.put('/:id', auth, pricingController.updatePricing);
router.delete('/:id', auth, pricingController.deletePricing);

module.exports = router;
