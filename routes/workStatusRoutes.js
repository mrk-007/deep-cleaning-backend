const express = require('express');
const router = express.Router();
const workStatusController = require('../controllers/workStatusController');
const auth = require('../middleware/auth');

router.get('/', workStatusController.getAllWorkStatuses);
router.get('/:id', workStatusController.getWorkStatusById);
router.post('/', auth, workStatusController.createWorkStatus);
router.put('/:id', auth, workStatusController.updateWorkStatus);
router.delete('/:id', auth, workStatusController.deleteWorkStatus);

module.exports = router;
