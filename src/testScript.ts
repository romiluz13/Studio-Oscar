import { testNotificationSystem } from './utils/testNotifications';

testNotificationSystem().then(() => {
  console.log('Notification test completed');
}).catch((error) => {
  console.error('Notification test failed:', error);
});