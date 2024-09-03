import { sendEmail } from './yourEmailService'; // Replace with your actual email service
import { logger } from './logger';

export const sendEmailNotification = async (email: string, mentionerName: string, postId: string, postText: string) => {
  const subject = `${mentionerName} mentioned you in a post`;
  const body = `
    ${mentionerName} mentioned you in a post:
    
    "${postText.substring(0, 100)}..."
    
    View the post: https://yourdomain.com/post/${postId}
  `;

  try {
    await sendEmail(email, subject, body);
    logger.info(`Email notification sent successfully to ${email}`);
  } catch (error) {
    logger.error(`Failed to send email notification to ${email}:`, error);
    throw error; // Re-throw the error so the caller can handle it
  }
};