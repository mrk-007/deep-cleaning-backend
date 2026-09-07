const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const timeSlotController = require('../controllers/timeSlotController');
const auth = require('../middleware/auth');
const { checkAvailability } = require('../middleware/availability');

// Dynamic availability endpoint for bookings
router.get('/availability', checkAvailability, timeSlotController.getAvailableTimeSlots);
router.post('/availability', checkAvailability, timeSlotController.getAvailableTimeSlots);

router.get('/', auth, bookingController.getAllBookings);
router.get('/:id', auth, bookingController.getBookingById);
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);

module.exports = router;
