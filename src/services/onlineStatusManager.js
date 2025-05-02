import { onlineStatusService } from './onlineStatusService';

export const startOnlineStatusPing = (userId) => {
  if (!userId) {
    console.warn('No userId provided for online status ping');
    return () => {};
  }

  const pingInterval = setInterval(() => {
    onlineStatusService.ping(userId)
      .then(() => console.log(`Ping sent for user ${userId}`))
      .catch(err => console.error('Lỗi ping:', err));
  }, 10000); // Ping mỗi 10 giây

  return () => clearInterval(pingInterval); // Hàm cleanup
};