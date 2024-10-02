const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Generate Password Reset Token
const createPasswordResetToken = (user) => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Send Password Reset Email
const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const resetUrl = `http://localhost:5000/resetPassword/${resetToken}`;
  await transporter.sendMail({
    to: email,
    subject: 'Password Reset',
    text: `Click this link to reset your password: ${resetUrl}`,
  });
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const resetToken = createPasswordResetToken(user);
  await user.save({ validateBeforeSave: false });
  await sendPasswordResetEmail(email, resetToken);
  res.status(200).json({ message: 'Password reset link sent to email' });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Token is invalid or expired' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.status(200).json({ message: 'Password reset successful' });
};
