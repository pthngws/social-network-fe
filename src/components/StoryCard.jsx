import React from 'react';
import { format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

const StoryCard = ({ story, onView }) => {
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (!isValid(date)) return '';

    try {
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: vi });
      }
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const isVideo = story.content?.toLowerCase().includes('.mp4') || 
                 story.content?.toLowerCase().includes('.webm');

  return (
    <div 
      className="relative w-28 h-48 rounded-xl overflow-hidden cursor-pointer group"
      onClick={() => onView(story)}
    >
      {/* Story Media Preview */}
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            src={story.content}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={story.content}
            alt="Story preview"
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
      </div>

      {/* User Info */}
      <div className="absolute top-2 left-2 right-2">
        <div className="flex items-center">
          <img
            src={story.userAvatar || '/default-avatar.png'}
            alt={story.userName}
            className="w-8 h-8 rounded-full border-2 border-blue-500"
          />
          <div className="ml-2">
            <p className="text-white text-sm font-medium truncate">
              {story.userName || `User ${story.userId}`}
            </p>
            <p className="text-gray-200 text-xs">
              {formatTimeAgo(story.postedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Music Info if exists */}
      {story.musicId && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center bg-black/40 rounded-full px-2 py-1">
            <span className="text-white text-xs truncate">
              🎵 Music #{story.musicId}
            </span>
          </div>
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
};

export default StoryCard; 