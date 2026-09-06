const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const auth = require('../middleware/auth');

router.get('/', paymentMethodController.getAllPaymentMethods);
router.get('/:id', paymentMethodController.getPaymentMethodById);
router.post('/', auth, paymentMethodController.createPaymentMethod);
router.put('/:id', auth, paymentMethodController.updatePaymentMethod);
router.delete('/:id', auth, paymentMethodController.deletePaymentMethod);

module.exports = router;
