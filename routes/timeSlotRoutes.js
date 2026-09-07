const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const auth = require('../middleware/auth');
const { checkAvailability } = require('../middleware/availability');

// Dynamic availability calculation (middleware-driven)
router.get('/availability', checkAvailability, timeSlotController.getAvailableTimeSlots);
router.post('/availability', checkAvailability, timeSlotController.getAvailableTimeSlots);

router.get('/', timeSlotController.getAllTimeSlots);
router.get('/:id', timeSlotController.getTimeSlotById);
router.post('/', auth, timeSlotController.createTimeSlot);
router.put('/:id', auth, timeSlotController.updateTimeSlot);
router.delete('/:id', auth, timeSlotController.deleteTimeSlot);

module.exports = router;
