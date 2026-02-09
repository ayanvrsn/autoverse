const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    if (!emailUser || !emailPass) {
        throw new Error('EMAIL_USER and EMAIL_PASS must be set');
    }

    await transporter.sendMail({
        from: `"AutoShop Support" <${emailUser}>`,
        to,
        subject,
        html: htmlContent
    });
};

module.exports = sendEmail;
