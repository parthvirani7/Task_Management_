const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel'); 
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); 
const app = express();
const PORT = process.env.PORT || 5000;

const taskRoutes = require('./routes/taskRoutes'); 
// Middleware
app.use(express.json());

// Use task routes
app.use('/api', taskRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/task_manager', { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// User Registration
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });

        res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Password Reset Functionality

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

    const resetUrl = `http://localhost:${PORT}/api/auth/resetPassword/${resetToken}`;
    await transporter.sendMail({
        to: email,
        subject: 'Password Reset',
        text: `Click this link to reset your password: ${resetUrl}`,
    });
};

// Request Password Reset
app.post('/api/auth/requestPasswordReset', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const resetToken = createPasswordResetToken(user);
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(email, resetToken);
    res.status(200).json({ message: 'Password reset link sent to email' });
});

// Reset Password
app.post('/api/auth/resetPassword/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
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
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
