import { MailService } from '@sendgrid/mail';

// Initialize the mail service
const mailService = new MailService();

// Check if the API key is set and configure the service
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using SendGrid
 * @param params Email parameters
 * @returns Promise<boolean> indicating success or failure
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // If API key is not set, log a warning and return false
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Email not sent.');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Sends a password reset email
 * @param to Recipient email
 * @param resetToken Password reset token
 * @param username Username
 * @returns Promise<boolean> indicating success or failure
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  // Return early if API key is not set
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Password reset email not sent.');
    return false;
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset - MoviePick';
  const text = `
    Hello ${username},
    
    You requested a password reset for your MoviePick account.
    
    Please use the following link to reset your password:
    ${resetUrl}
    
    This link will expire in 24 hours.
    
    If you did not request this reset, please ignore this email.
    
    Regards,
    The MoviePick Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">MoviePick Password Reset</h2>
      <p>Hello ${username},</p>
      <p>You requested a password reset for your MoviePick account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Regards,<br>The MoviePick Team</p>
    </div>
  `;
  
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@moviepick.app';
  
  return sendEmail({
    to,
    from: fromEmail,
    subject,
    text,
    html
  });
}