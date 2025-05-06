import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { XMarkIcon, HeartIcon, EyeIcon, SpeakerWaveIcon, SpeakerXMarkIcon, TrashIcon } from '@heroicons/react/24/solid';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import StoryProgressBar from './StoryProgressBar';

const IMAGE_DURATION = 60000; // 60 giây cho hình ảnh

const REACTION_TYPES = {
  LIKE: { icon: '/emojis/like.svg', label: 'Thích' },
  LOVE: { icon: '/emojis/love.svg', label: 'Yêu thích' },
  HAHA: { icon: '/emojis/haha.svg', label: 'Haha' },
  WOW: { icon: '/emojis/wow.svg', label: 'Wow' },
  SAD: { icon: '/emojis/sad.svg', label: 'Buồn' },
  ANGRY: { icon: '/emojis/angry.svg', label: 'Phẫn nộ' }
};

const StoryViewer = ({ stories: allStories, currentIndex, onClose, onNext, onPrevious, onDelete, audioRefs }) => {
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

  // Sắp xếp stories - giữ nguyên thứ tự gốc
  useEffect(() => {
    if (!allStories?.length) return;
    setSortedStories([...allStories]);
  }, [allStories]);

  // Lấy các story của cùng một người dùng
  const getCurrentUserStories = () => {
    if (!currentStory) return [];
    return allStories.filter(story => story.userId === currentStory.userId);
  };

  // Hàm bắt đầu thanh tiến trình
  const startProgress = (useFallback = false) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Xác định thời lượng
    let duration;
    if (useFallback || !currentStory?.musicUrl || !isAudioReady) {
      // Sử dụng thời lượng dự phòng cho hình ảnh hoặc khi âm thanh chưa sẵn sàng
      duration = IMAGE_DURATION;
    } else if (currentStory?.musicUrl && currentStory?.musicDuration) {
      // Sử dụng thời lượng nhạc
      duration = currentStory.musicDuration * 1000;
    } else if (isVideo(currentStory.content) && videoRef.current?.duration) {
      // Sử dụng thời lượng video
      duration = videoRef.current.duration * 1000;
    } else {
      // Mặc định dự phòng
      duration = IMAGE_DURATION;
    }

    const increment = 100 / (duration / 100);

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval.current);
          onNext();
          return 0;
        }
        return prev + increment;
      });
    }, 100);
  };

  // Tải dữ liệu story
  useEffect(() => {
    const loadStory = async () => {
      try {
        const story = sortedStories[currentIndex];
        if (!story) return;

        console.log('Đang tải story:', story);

        // Kiểm tra xem người dùng hiện tại có phải là chủ story
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
          const viewedStories = JSON.parse(localStorage.getItem('viewedStories') || '[]');
          if (!viewedStories.includes(story.id)) {
            viewedStories.push(story.id);
            localStorage.setItem('viewedStories', JSON.stringify(viewedStories));
          }
        }

        // Tải tương tác nếu là chủ story
        if (isOwner) {
          const response = await storyService.getStoryInteractions(story.id);
          if (response.data.status === 200) {
            setInteractions(response.data.data);
          }
        }

        // Bắt đầu thanh tiến trình ngay lập tức với thời lượng dự phòng
        startProgress(true);

        // Xử lý âm thanh
        if (audioRefs && audioRefs[story.id] && story.musicUrl) {
          audioRef.current = audioRefs[story.id];
          audioRef.current.muted = isMuted;

          // Chờ metadata âm thanh
          await new Promise((resolve, reject) => {
            if (audioRef.current.readyState >= 2) {
              // Metadata đã được tải
              const audioDuration = audioRef.current.duration;
              const musicStart = Math.max(0, story.musicStart || 0);
              const musicDuration = Math.min(
                story.musicDuration || audioDuration,
                audioDuration - musicStart
              );
              audioRef.current.currentTime = musicStart;
              setIsAudioReady(true);

              // Khởi động lại thanh tiến trình với thời lượng chính xác
              setProgress(0);
              startProgress(false);

              resolve();
            } else {
              audioRef.current.onloadedmetadata = () => {
                if (audioRef.current) {
                  const audioDuration = audioRef.current.duration;
                  const musicStart = Math.max(0, story.musicStart || 0);
                  const musicDuration = Math.min(
                    story.musicDuration || audioDuration,
                    audioDuration - musicStart
                  );
                  audioRef.current.currentTime = musicStart;
                  setIsAudioReady(true);

                  // Khởi động lại thanh tiến trình với thời lượng chính xác
                  setProgress(0);
                  startProgress(false);

                  resolve();
                }
              };
              audioRef.current.onerror = () => {
                console.error('Lỗi tải metadata âm thanh');
                setIsAudioReady(true); // Tiếp tục ngay cả khi âm thanh lỗi
                reject();
              };
            }
          });

          // Phát âm thanh nếu không bị tắt tiếng
          if (!isMuted) {
            try {
              await audioRef.current.play();
              console.log('Nhạc bắt đầu phát tại', story.musicStart, 'trong', story.musicDuration, 'giây');
            } catch (error) {
              console.error('Lỗi phát nhạc:', error);
            }
          }

          // Dừng âm thanh khi đoạn nhạc kết thúc
          const checkAudioTime = () => {
            if (audioRef.current && audioRef.current.currentTime >= story.musicStart + story.musicDuration) {
              audioRef.current.pause();
              audioRef.current.currentTime = story.musicStart;
            }
          };
          audioRef.current.addEventListener('timeupdate', checkAudioTime);

          // Dọn dẹp listener
          return () => {
            if (audioRef.current) {
              audioRef.current.removeEventListener('timeupdate', checkAudioTime);
            }
          };
        } else {
          setIsAudioReady(true); // Không có âm thanh, giữ thời lượng dự phòng
        }
      } catch (error) {
        console.error('Lỗi tải story:', error);
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
  }, [currentIndex, sortedStories, isMuted, audioRefs]);

  // Kiểm tra story hết hạn
  useEffect(() => {
    if (!currentStory) return;

    const expiresAt = new Date(currentStory.expiresAt);
    if (expiresAt < new Date()) {
      onNext();
    }
  }, [currentStory, onNext]);

  // Đồng bộ âm thanh với trạng thái tạm dừng/tiếp tục
  useEffect(() => {
    if (audioRef.current && currentStory?.musicUrl) {
      if (isPaused) {
        audioRef.current.pause();
      } else if (!isMuted && isAudioReady) {
        audioRef.current.play().catch(error => {
          console.error('Lỗi tiếp tục âm thanh:', error);
        });
      }
    }
  }, [isPaused, isMuted, isAudioReady, currentStory]);

  const handleReact = async (reactionType) => {
    try {
      const response = await storyService.reactStory(currentStory.id, reactionType);
      
      if (response.data.status === 200) {
        setSelectedReaction(reactionType);
        
        if (isStoryOwner) {
          const interactionsResponse = await storyService.getStoryInteractions(currentStory.id);
          if (interactionsResponse.data.status === 200) {
            setInteractions(interactionsResponse.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi phản ứng story:', error);
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
      console.error('Lỗi xóa story:', error);
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
    startProgress(!isAudioReady); // Sử dụng thời lượng phù hợp
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Lỗi tiếp tục video:', error);
      });
    }
    if (audioRef.current && !isMuted && isAudioReady) {
      audioRef.current.play().catch(error => {
        console.error('Lỗi tiếp tục âm thanh:', error);
      });
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
  const shouldShowProgress = true; // Luôn hiển thị thanh tiến trình

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p Stuart p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Container Story */}
      <div className="relative max-w-md w-full h-[80vh] bg-gray-900 rounded-xl overflow-hidden">
        {/* Thanh tiến trình */}
        {currentStory && shouldShowProgress && (
          <StoryProgressBar
            stories={getCurrentUserStories()}
            currentStoryIndex={getCurrentUserStories().findIndex(s => s.id === currentStory.id)}
            progress={progress}
          />
        )}

        {/* Nội dung Story */}
        <div
          className="relative w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Container Media với Overlay */}
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

            {/* Overlay Media */}
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Thông tin người dùng */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <Link 
              to={`/${currentStory.userId}`}
              className="flex items-center bg-black/30 rounded-full p-2 hover:bg-black/50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
              }}
            >
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
            </Link>
            {isStoryOwner && (
              <button
                onClick={handleDeleteStory}
                className="text-white hover:text-red-500 transition-colors p-2 bg-black/30 rounded-full"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Trình phát nhạc */}
          {currentStory.musicUrl && (
            <>
              <div className="absolute bottom-20 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center bg-black/40 rounded-full px-4 py-2">
                  <span className="text-white mr-3">
                    🎵 Đang phát nhạc
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

          {/* Phản ứng */}
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

          {/* Bảng tương tác - Chỉ hiển thị cho chủ story */}
          {showInteractions && isStoryOwner && (
            <div className="absolute left-4 bottom-16 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
              <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                Lượt xem và tương tác
              </h4>
              <div className="space-y-2">
                {interactions.map((interaction, index) => (
                  <Link
                    key={index}
                    to={`/${interaction.userId}`}
                    className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(true);
                    }}
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
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nút điều hướng */}
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default StoryViewer;