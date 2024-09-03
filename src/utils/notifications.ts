import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendEmailNotification } from './email';
import { logger } from '../utils/logger'; // Updated import path

export const sendNotification = async (userId: string, postId: string, mentionerName: string, postText: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      logger.warn(`User ${userId} not found when sending notification`);
      return;
    }

    const userData = userSnap.data();
    const userEmail = userData.email;
    const emailNotificationsEnabled = userData.emailNotifications !== false; // Default to true if not set

    // Add notification to user's notifications collection
    await setDoc(doc(db, 'users', userId, 'notifications', postId), {
      type: 'mention',
      postId,
      mentionerName,
      postText: postText.substring(0, 100) + '...', // Preview of the post
      createdAt: new Date(),
      read: false,
    }, { merge: true });

    logger.info(`In-app notification added for user ${userId}`);

    // Send email notification if enabled
    if (emailNotificationsEnabled && userEmail) {
      await sendEmailNotification(userEmail, mentionerName, postId, postText);
      logger.info(`Email notification sent to ${userEmail}`);
    } else {
      logger.info(`Email notification not sent. Enabled: ${emailNotificationsEnabled}, Email: ${userEmail}`);
    }
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error; // Re-throw the error so the caller can handle it
  }
};