const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const auth = require('../middleware/auth');

router.get('/', timeSlotController.getAllTimeSlots);
router.get('/:id', timeSlotController.getTimeSlotById);
router.post('/', auth, timeSlotController.createTimeSlot);
router.put('/:id', auth, timeSlotController.updateTimeSlot);
router.delete('/:id', auth, timeSlotController.deleteTimeSlot);

module.exports = router;
