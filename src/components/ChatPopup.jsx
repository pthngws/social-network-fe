import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FaComments } from 'react-icons/fa';

const ChatPopup = ({ selectedFriend: propSelectedFriend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const chatBoxRef = useRef(null);
  const chatPopupRef = useRef(null);
  const senderId = String(localStorage.getItem('userId'));
  const navigate = useNavigate();

  useEffect(() => {
    if (propSelectedFriend) {
      setSelectedFriend(propSelectedFriend);
      setIsOpen(true);
    }
  }, [propSelectedFriend]);

  useEffect(() => {
    if (selectedFriend && isOpen) {
      connectWebSocket();
      loadMessages();
    }
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [selectedFriend, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatPopupRef.current &&
        !chatPopupRef.current.contains(event.target) &&
        !event.target.closest('.chat-bubble-button')
      ) {
        setIsOpen(false);
        setSelectedFriend(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const connectWebSocket = () => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.connect({}, () => {
      client.subscribe('/topic/public', () => loadMessages());
      setStompClient(client);
    }, (error) => console.error('WebSocket error:', error));
  };

  const loadMessages = () => {
    if (selectedFriend) {
      messageService.getMessages(senderId, selectedFriend.userID)
        .then(response => {
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
      stompClient.send('/app/sendMessage', {}, JSON.stringify(message));
      setMessageInput('');
      loadMessages();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
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
    {selectedFriend.isOnline ? 'Đang hoạt động' : `Hoạt động ${selectedFriend.minutesAgo} phút trước`}
  </span>
)}
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedFriend(null);
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
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