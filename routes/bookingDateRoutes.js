const express = require('express');
const router = express.Router();
const bookingDateController = require('../controllers/bookingDateController');
const auth = require('../middleware/auth');

router.get('/', bookingDateController.getAllBookingDates);
router.get('/:id', bookingDateController.getBookingDateById);
router.post('/', auth, bookingDateController.createBookingDate);
router.put('/:id', auth, bookingDateController.updateBookingDate);
router.delete('/:id', auth, bookingDateController.deleteBookingDate);

module.exports = router;
