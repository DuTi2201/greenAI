/**
 * Gửi email đặt lại mật khẩu
 * @param email Email người nhận
 * @param token Token đặt lại mật khẩu
 */
export const sendResetPasswordEmail = async (email: string, resetToken: string) => {
  // Tạo URL đặt lại mật khẩu
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  // Nội dung email
  const subject = 'Đặt lại mật khẩu GardenAI';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4CAF50; text-align: center;">Đặt lại mật khẩu GardenAI</h2>
      <p>Xin chào,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đặt lại mật khẩu</a>
      </div>
      <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${resetUrl}</p>
      <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ GardenAI</p>
    </div>
  `;
  
  // Trong môi trường phát triển, sử dụng nodemailer để gửi email thực tế
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    try {
      const nodemailer = require('nodemailer');
      
      // Tạo transporter với cấu hình SMTP
      // Lưu ý: Bạn cần cấu hình SMTP server hoặc sử dụng dịch vụ như Gmail, SendGrid, Mailgun, v.v.
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      // Gửi email
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"GardenAI" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`Email sent: ${info.messageId}`);
      console.log(`Reset password URL: ${resetUrl}`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending email:', error);
      // Vẫn trả về resolved promise để không làm gián đoạn luồng xử lý
      // nhưng ghi log lỗi để debug
      return Promise.resolve();
    }
  } else {
    // Trong môi trường production, sẽ sử dụng dịch vụ email thực tế
    console.log(`[DEV MODE] Sending reset password email to ${email}`);
    console.log(`Reset password URL: ${resetUrl}`);
    return Promise.resolve();
  }
};

/**
 * Gửi email test để kiểm tra cấu hình SMTP
 * @param email Email người nhận
 */
export const sendTestEmail = async (email: string) => {
  try {
    const nodemailer = require('nodemailer');
    
    // Tạo transporter với cấu hình SMTP từ file .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true cho 465, false cho các port khác
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Nội dung email
    const subject = 'Test Email từ GardenAI';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4CAF50; text-align: center;">Test Email từ GardenAI</h2>
        <p>Xin chào,</p>
        <p>Đây là email test để kiểm tra cấu hình SMTP của hệ thống GardenAI.</p>
        <p>Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động chính xác.</p>
        <p>Trân trọng,<br>Đội ngũ GardenAI</p>
      </div>
    `;
    
    // Gửi email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"GardenAI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    });
    
    console.log(`Test email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error };
  }
}; 