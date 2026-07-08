const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword, changePassword, getMe, updateProfile, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
