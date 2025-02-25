/**
 * Gửi email đặt lại mật khẩu
 * @param email Email người nhận
 * @param token Token đặt lại mật khẩu
 */
export const sendResetPasswordEmail = async (email: string, resetToken: string) => {
  // In production, this would send an actual email
  console.log(`Sending reset password email to ${email} with token ${resetToken}`);
  return Promise.resolve();
}; 