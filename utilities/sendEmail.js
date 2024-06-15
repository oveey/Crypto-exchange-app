const nodemailer = require('nodemailer');

class EmailService {
  async sendVerificationEmail(to, message) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS,
        },
      });

      const mailOptions = {
        from: {
          name: process.env.NODEMAILER_NAME,
          address: process.env.NODEMAILER_USER,
        },
        to,
        subject: 'Azax Email Verification',
        text: message,
      };

      await transporter.sendMail(mailOptions);

      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}

module.exports = new EmailService();
