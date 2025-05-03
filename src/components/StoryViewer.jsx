import React, { useState, useEffect, useRef } from 'react';
import { storyService } from '../services/storyService';
import { XMarkIcon, HeartIcon, EyeIcon, SpeakerWaveIcon, SpeakerXMarkIcon, TrashIcon } from '@heroicons/react/24/solid';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import StoryProgressBar from './StoryProgressBar';

const IMAGE_DURATION = 60000; // 60 seconds for images

const REACTION_TYPES = {
  LIKE: { icon: '/emojis/like.svg', label: 'Thích' },
  LOVE: { icon: '/emojis/love.svg', label: 'Yêu thích' },
  HAHA: { icon: '/emojis/haha.svg', label: 'Haha' },
  WOW: { icon: '/emojis/wow.svg', label: 'Wow' },
  SAD: { icon: '/emojis/sad.svg', label: 'Buồn' },
  ANGRY: { icon: '/emojis/angry.svg', label: 'Phẫn nộ' }
};

const StoryViewer = ({ stories: allStories, currentIndex, onClose, onNext, onPrevious, onDelete }) => {
  const [currentStory, setCurrentStory] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [showInteractions, setShowInteractions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [error, setError] = useState(null);
  const [isStoryOwner, setIsStoryOwner] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [sortedStories, setSortedStories] = useState([]);
  const progressInterval = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const isVideo = (url) => {
    return url?.toLowerCase().includes('.mp4') || url?.toLowerCase().includes('.webm');
  };

  // Sort stories - current user's stories first
  useEffect(() => {
    if (!allStories?.length) return;
    setSortedStories([...allStories]); // Không sắp xếp lại, giữ nguyên thứ tự từ StoryList
  }, [allStories]);

  // Get current story's siblings (other stories from same user)
  const getCurrentUserStories = () => {
    if (!currentStory) return [];
    return allStories.filter(story => story.userId === currentStory.userId);
  };

  const startProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const duration = currentStory && isVideo(currentStory.content) && videoRef.current 
      ? videoRef.current.duration * 1000 
      : IMAGE_DURATION;
    
    const increment = 100 / (duration / 100);

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current);
          onNext();
          return 0;
        }
        return prev + increment;
      });
    }, 100);
  };

  useEffect(() => {
    const loadStory = async () => {
      try {
        const story = sortedStories[currentIndex];
        if (!story) return;

        // Check if story is expired
        const expiresAt = new Date(story.expiresAt);
        if (expiresAt < new Date()) {
          onNext();
          return;
        }

        console.log('Loading story:', story);
        
        // Check if current user is the story owner
        const currentUserId = localStorage.getItem('userId');
        const isOwner = currentUserId === story.userId.toString();
        setIsStoryOwner(isOwner);
        
        setCurrentStory(story);
        setProgress(0);
        setIsAudioReady(false);
        setError(null);

        // Gọi API đánh dấu đã xem story và lưu vào localStorage
        if (!isOwner) {
          await storyService.viewStory(story.id);
          // Lưu story ID vào localStorage
          const viewedStories = JSON.parse(localStorage.getItem('viewedStories') || '[]');
          if (!viewedStories.includes(story.id)) {
            viewedStories.push(story.id);
            localStorage.setItem('viewedStories', JSON.stringify(viewedStories));
          }
        }

        // Load interactions only if user is the story owner
        if (isOwner) {
          const response = await storyService.getStoryInteractions(story.id);
          if (response.data.status === 200) {
            setInteractions(response.data.data);
          }
        }

        // Handle audio
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (!isMuted && story.musicUrl) {
            try {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                await playPromise;
                console.log('Music started playing successfully');
                setIsAudioReady(true);
              }
            } catch (error) {
              console.error('Music playback failed:', error);
            }
          }
        }

        // Start progress after everything is loaded
        startProgress();
      } catch (error) {
        console.error('Error loading story:', error);
        setError('Không thể tải story. Vui lòng thử lại sau.');
      }
    };

    loadStory();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIndex, sortedStories]);

  const handleReact = async (reactionType) => {
    try {
      const response = await storyService.reactStory(currentStory.id, reactionType);
      
      if (response.data.status === 200) {
        setSelectedReaction(reactionType);
        
        // Nếu là chủ story thì update lại danh sách tương tác
        if (isStoryOwner) {
          const interactionsResponse = await storyService.getStoryInteractions(currentStory.id);
          if (interactionsResponse.data.status === 200) {
            setInteractions(interactionsResponse.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error reacting to story:', error);
    }
  };

  const handleDeleteStory = async () => {
    try {
      if (!currentStory) return;
      
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa story này?');
      if (!confirmed) return;

      await storyService.deleteStory(currentStory.id);
      if (onDelete) {
        onDelete(currentStory.id);
      }
      onNext();
    } catch (error) {
      console.error('Error deleting story:', error);
      setError('Không thể xóa story. Vui lòng thử lại sau.');
    }
  };

  const handleMouseDown = () => {
    setIsPaused(true);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleMouseUp = () => {
    setIsPaused(false);
    startProgress();
    if (videoRef.current) {
      videoRef.current.play();
    }
    if (audioRef.current && !isMuted) {
      audioRef.current.play();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (!isValid(date)) return '';
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
          <p className="text-red-500 text-center mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (!currentStory) return null;

  const currentIsVideo = isVideo(currentStory.content);
  const shouldShowProgress = !currentStory.musicUrl || isAudioReady;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Story Container */}
      <div className="relative max-w-md w-full h-[80vh] bg-gray-900 rounded-xl overflow-hidden">
        {/* Progress Bars */}
        {currentStory && (
          <StoryProgressBar
            stories={getCurrentUserStories()}
            currentStoryIndex={getCurrentUserStories().findIndex(s => s.id === currentStory.id)}
            progress={progress}
          />
        )}

        {/* Story Content */}
        <div
          className="relative w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Media Container with Overlay */}
          <div className="relative w-full h-full">
            {/* Media */}
            {currentIsVideo ? (
              <video
                ref={videoRef}
                src={currentStory.content}
                className="w-full h-full object-contain"
                autoPlay
                muted
                onEnded={onNext}
              />
            ) : (
              <img
                src={currentStory.content}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}

            {/* Media Overlays */}
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* User Info */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center bg-black/30 rounded-full p-2">
              <img
                src={currentStory.avatar}
                alt={currentStory.fullName}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
              />
              <div className="ml-3">
                <p className="text-white font-medium">
                  {currentStory.fullName}
                </p>
                <p className="text-gray-200 text-sm">
                  {formatTimeAgo(currentStory.postedAt)}
                </p>
              </div>
            </div>
            {isStoryOwner && (
              <button
                onClick={handleDeleteStory}
                className="text-white hover:text-red-500 transition-colors p-2 bg-black/30 rounded-full"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Music Player */}
          {currentStory.musicUrl && (
            <>
              <audio
                ref={audioRef}
                src={currentStory.musicUrl}
                loop
                muted={isMuted}
                onError={(e) => console.error('Audio error:', e)}
                onPlay={() => console.log('Audio started playing')}
                onPause={() => console.log('Audio paused')}
              />
              <div className="absolute bottom-20 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center bg-black/40 rounded-full px-4 py-2">
                  <span className="text-white mr-3">
                    🎵 Playing music
                  </span>
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-blue-500 transition-colors"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="w-6 h-6" />
                    ) : (
                      <SpeakerWaveIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Reactions */}
          <div className="absolute bottom-4 left-4 right-4">
            {!isStoryOwner ? (
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-1 bg-black/30 px-3 py-2 rounded-full">
                  {Object.entries(REACTION_TYPES).map(([type, { icon, label }]) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className={`reaction-btn group relative ${
                        selectedReaction === type ? 'scale-125' : 'hover:scale-110'
                      } transition-transform mx-1`}
                      title={label}
                    >
                      <img 
                        src={icon} 
                        alt={label} 
                        className="w-8 h-8"
                      />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInteractions(!showInteractions)}
                  className="text-white hover:text-blue-500 transition-colors bg-black/30 px-4 py-2 rounded-full flex items-center gap-2"
                >
                  <EyeIcon className="w-6 h-6" />
                  <span className="text-sm">Xem lượt tương tác</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactions Panel - Only visible for story owner */}
          {showInteractions && isStoryOwner && (
            <div className="absolute left-4 bottom-16 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
              <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                Lượt xem và tương tác
              </h4>
              <div className="space-y-2">
                {interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2"
                  >
                    <img
                      src={interaction.avatar}
                      alt={interaction.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="ml-2 flex-grow">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {interaction.fullName}
                        </p>
                        {interaction.reactionType && (
                          <img 
                            src={REACTION_TYPES[interaction.reactionType]?.icon}
                            alt={REACTION_TYPES[interaction.reactionType]?.label}
                            className="w-5 h-5"
                            title={REACTION_TYPES[interaction.reactionType]?.label}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(interaction.interactedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={onPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-all transform hover:scale-110 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={onNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-all transform hover:scale-110 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default StoryViewer; 