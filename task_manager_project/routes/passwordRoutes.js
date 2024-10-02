const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordController');
const router = express.Router();

router.post('/requestPasswordReset', requestPasswordReset);
router.post('/resetPassword', resetPassword);

module.exports = router;
