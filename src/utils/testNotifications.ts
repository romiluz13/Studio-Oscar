import { sendNotification } from './notifications';
import { logger } from './logger';

export const testNotificationSystem = async () => {
  const testUserId = 'testUser123';
  const testPostId = 'testPost456';
  const testMentionerName = 'Test Mentioner';
  const testPostText = 'This is a test post mentioning @testUser123';

  try {
    await sendNotification(testUserId, testPostId, testMentionerName, testPostText);
    logger.info('Test notification sent successfully');
  } catch (error) {
    logger.error('Test notification failed:', error);
  }
};