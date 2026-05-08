const sendEmail = require('../utils/sendEmail');
const ApiError = require('../utils/helpers').ApiError;

exports.submitContact = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            throw new ApiError('Please provide all required fields', 400);
        }

        // Send to ADMIN_EMAIL if defined, otherwise send to the same email used for sending
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER;

        if (!adminEmail) {
            throw new ApiError('Email service not configured completely on server', 500);
        }

        const emailMessage = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #f59e0b;">New Contact Form Submission</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                </div>
                <h3 style="margin-top: 20px;">Message:</h3>
                <div style="background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                    <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                </div>
            </div>
        `;

        await sendEmail({
            email: adminEmail,
            subject: `Contact Request: ${subject}`,
            message: emailMessage
        });

        res.status(200).json({ success: true, message: 'Your message has been sent successfully.' });
    } catch (error) {
        next(error);
    }
};
