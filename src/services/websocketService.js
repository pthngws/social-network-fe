import SockJS from 'sockjs-client';
import { over } from 'stompjs';

let stompClient = null;

export const connectWebSocket = (userEmail, onMessageReceived) => {
  if (!userEmail) {
    console.error('User email is required for WebSocket connection');
    return;
  }

  const socket = new SockJS('/ws');
  stompClient = over(socket);

  stompClient.connect(
    {},
    () => {
      console.log('WebSocket connected');
      stompClient.subscribe(`/topic/notifications/${userEmail}`, (message) => {
        const notification = JSON.parse(message.body);
        console.log('Received notification:', notification);
        onMessageReceived(notification);
      });
    },
    (error) => {
      console.error('WebSocket error:', error);
      setTimeout(() => connectWebSocket(userEmail, onMessageReceived), 5000);
    }
  );
};

export const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => {
      console.log('WebSocket disconnected');
      stompClient = null;
    });
  } else {
    console.log('No active WebSocket connection to disconnect');
  }
};