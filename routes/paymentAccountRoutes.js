const express = require('express');
const router = express.Router();
const paymentAccountController = require('../controllers/paymentAccountController');
const auth = require('../middleware/auth');

router.get('/', paymentAccountController.getAllPaymentAccounts);
router.get('/:id', paymentAccountController.getPaymentAccountById);
router.post('/', auth, paymentAccountController.createPaymentAccount);
router.put('/:id', auth, paymentAccountController.updatePaymentAccount);
router.delete('/:id', auth, paymentAccountController.deletePaymentAccount);

module.exports = router;
