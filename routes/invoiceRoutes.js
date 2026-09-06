const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

router.get('/', auth, invoiceController.getAllInvoices);
router.get('/booking/:bookingId', auth, invoiceController.getInvoiceByBookingId);
router.get('/:id', auth, invoiceController.getInvoiceById);
router.post('/', auth, invoiceController.createInvoice);
router.delete('/:id', auth, invoiceController.deleteInvoice);

module.exports = router;
