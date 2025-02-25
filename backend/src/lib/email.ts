import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-specific-password'
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}; 