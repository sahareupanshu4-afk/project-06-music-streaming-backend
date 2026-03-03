const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;