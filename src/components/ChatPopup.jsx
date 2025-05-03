import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FaComments } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const ChatPopup = ({ selectedFriend: propSelectedFriend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatBoxRef = useRef(null);
  const chatPopupRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const senderId = String(localStorage.getItem('userId'));
  const navigate = useNavigate();

  useEffect(() => {
    if (propSelectedFriend) {
      setSelectedFriend(propSelectedFriend);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSelectedFriend(null);
    }
  }, [propSelectedFriend]);

  useEffect(() => {
    if (selectedFriend && isOpen) {
      console.log('Opening ChatPopup for friend:', selectedFriend);
      messageService
        .markMessagesAsRead(selectedFriend.userID)
        .then(() => {
          console.log('Messages marked as read successfully');
        })
        .catch((error) => {
          console.error('Lỗi đánh dấu tin nhắn đã đọc:', error);
        })
        .finally(() => {
          if (selectedFriend.refreshFriendList) {
            console.log('Calling refreshFriendList after marking messages');
            selectedFriend.refreshFriendList();
          }
        });

      connectWebSocket();
      loadMessages();
    }
    return () => {
      if (stompClient) {
        console.log('Disconnecting WebSocket in ChatPopup');
        stompClient.disconnect();
      }
    };
  }, [selectedFriend, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatPopupRef.current &&
        !chatPopupRef.current.contains(event.target) &&
        !event.target.closest('.chat-bubble-button') &&
        (!emojiButtonRef.current || !emojiButtonRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setSelectedFriend(null);
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const connectWebSocket = () => {
    console.log('Connecting WebSocket in ChatPopup');
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.connect({}, () => {
      console.log('WebSocket connected in ChatPopup');
      client.subscribe('/topic/public', (message) => {
        console.log('Received WebSocket message in ChatPopup:', message.body);
        const receivedMessage = JSON.parse(message.body);
        if (
          (String(receivedMessage.senderId) === senderId &&
            String(receivedMessage.receiverId) === String(selectedFriend.userID)) ||
          (String(receivedMessage.senderId) === String(selectedFriend.userID) &&
            String(receivedMessage.receiverId) === senderId)
        ) {
          setMessages((prev) => [...prev, {
            id: Date.now(),
            contentMessage: receivedMessage.content,
            senderID: receivedMessage.senderId,
            timestamp: receivedMessage.timestamp,
          }]);
          if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
          }
          if (selectedFriend.refreshFriendList) {
            console.log('Refreshing friend list due to new message');
            selectedFriend.refreshFriendList();
          }
        }
      });
      setStompClient(client);
    }, (error) => {
      console.error('WebSocket error in ChatPopup:', error);
    });
  };

  const loadMessages = () => {
    if (selectedFriend) {
      console.log('Loading messages for friend:', selectedFriend.userID);
      messageService.getMessages(senderId, selectedFriend.userID)
        .then(response => {
          console.log('Messages loaded:', response.data);
          setMessages(response.data);
          if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
          }
        })
        .catch(error => console.error('Lỗi lấy tin nhắn:', error));
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && stompClient && selectedFriend) {
      const message = {
        content: messageInput,
        senderId: senderId,
        receiverId: selectedFriend.userID,
        timestamp: new Date().toISOString(),
      };
      console.log('Sending message:', message);
      stompClient.send('/app/sendMessage', {}, JSON.stringify(message));
      setMessageInput('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatMinutesAgo = (minutesAgo) => {
    if (minutesAgo < 60) {
      return `${minutesAgo} phút trước`;
    }
    const hours = Math.floor(minutesAgo / 60);
    if (hours < 24) {
      return `${hours} giờ trước`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };
  

  return (
    <>
      {isOpen && selectedFriend && (
        <div
          ref={chatPopupRef}
          className="fixed bottom-5 right-24 w-80 h-[450px] bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg flex flex-col z-40"
        >
          <div className="flex justify-between items-center bg-blue-500 text-white p-4 rounded-t-lg">
            <div className="flex items-center">
              {selectedFriend && (
                <div className="relative mr-2">
                  <img
                    src={selectedFriend.avatar || 'https://via.placeholder.com/32'}
                    alt={selectedFriend.name}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/32';
                    }}
                    onClick={() => navigate(`/${selectedFriend.userID}`)}
                  />
                </div>
              )}
              <div className="flex flex-col">
                <span
                  className="font-semibold cursor-pointer"
                  onClick={() => selectedFriend && navigate(`/${selectedFriend.userID}`)}
                >
                  {selectedFriend ? selectedFriend.name : 'Tin Nhắn'}
                </span>
                {selectedFriend && (
                  <span className="text-xs text-blue-200 flex items-center gap-1">
                    {selectedFriend.isOnline && (
                      <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                    )}
                    {selectedFriend.isOnline ? 'Đang hoạt động' : `Hoạt động ${formatMinutesAgo(selectedFriend.minutesAgo)}`}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedFriend(null);
                setShowEmojiPicker(false);
              }}
              className="hover:bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          <div ref={chatBoxRef} className="p-4 flex-1 overflow-y-auto custom-scroll">
            {messages.map((msg, index) => {
              const showDate =
                index === 0 ||
                formatDateSeparator(messages[index - 1].timestamp) !== formatDateSeparator(msg.timestamp);
              const isSender = String(msg.senderID) === senderId;
              const senderInfo = isSender
                ? { avatar: '' }
                : selectedFriend;
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center text-gray-500 dark:text-gray-400 my-3">
                      <small className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                        {formatDateSeparator(msg.timestamp)}
                      </small>
                    </div>
                  )}
                  <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-3 items-start`}>
                    {!isSender && (
                      <div className="relative">
                        <img
                          src={senderInfo.avatar || 'https://via.placeholder.com/32'}
                          alt={senderInfo.name}
                          className="w-8 h-8 rounded-full object-cover mr-2 mt-3 cursor-pointer"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/32';
                          }}
                          onClick={() => navigate(`/${msg.senderID}`)}
                        />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] ${
                        isSender
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-tl-none'
                      }`}
                    >
                      <span className="break-words">{msg.contentMessage}</span>
                      <div
                        className={`text-xs mt-1 ${
                          isSender ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 relative">
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
            <div className="flex items-center">
              <button
                ref={emojiButtonRef}
                className="p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                😊
              </button>
              <input
                type="text"
                placeholder="Soạn tin nhắn"
                className="flex-1 p-3 rounded-l-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="bg-blue-500 text-white p-3 rounded-r-full hover:bg-blue-600 transition-colors duration-200"
                onClick={sendMessage}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPopup;