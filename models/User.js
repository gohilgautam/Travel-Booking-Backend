const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'] },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
        role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
        phone: { type: String, unique: true, sparse: true },
        address: { type: String },
        avatar: { type: String },
        isBlocked: { type: Boolean, default: false },
        otp: { type: String },
        otpExpire: { type: Date },
        otpSendCount: { type: Number, default: 0 },
        otpSendDate: { type: Date },
        otpFailedCount: { type: Number, default: 0 },
        otpLockoutUntil: { type: Date },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);