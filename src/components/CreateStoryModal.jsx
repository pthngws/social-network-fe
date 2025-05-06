import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { storyService } from '../services/storyService';
import { useApiLoading } from '../hooks/useApiLoading';

const CreateStoryModal = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicStart, setMusicStart] = useState(0);
  const [musicEnd, setMusicEnd] = useState(30);
  const [musicDuration, setMusicDuration] = useState(30);
  const [musicLength, setMusicLength] = useState(0);
  const [musics, setMusics] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingMusics, setIsLoadingMusics] = useState(false);
  const { startLoading, stopLoading } = useApiLoading();
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMusics();
    } else {
      setSelectedFile(null);
      setPreview(null);
      setSelectedMusic(null);
      setMusicStart(0);
      setMusicEnd(30);
      setMusicDuration(30);
      setMusicLength(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setCurrentPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  }, [isOpen]);

  const loadMusics = async () => {
    try {
      setIsLoadingMusics(true);
      const response = await storyService.getAllMusics();
      if (response.data.status === 200) {
        setMusics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading musics:', error);
    } finally {
      setIsLoadingMusics(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    setMusicStart(0);
    setMusicEnd(30);
    setMusicDuration(30);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.load();

      audioRef.current.onloadedmetadata = async () => {
        if (audioRef.current) {
          const duration = Math.floor(audioRef.current.duration);
          setMusicLength(duration);
          const end = duration > 30 ? 30 : duration;
          setMusicEnd(end);
          setMusicDuration(end);

          try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            setIsPlaying(true);
            setCurrentPlayingId(music.id);
          } catch (error) {
            console.error('Error auto-playing audio:', error);
            setIsPlaying(false);
            setCurrentPlayingId(null);
          }
        }
      };
    }
  };

  const handlePlayPause = async (music, e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (currentPlayingId === music.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    } else {
      try {
        if (currentPlayingId !== music.id) {
          audioRef.current.src = music.url;
          audioRef.current.load();
          await new Promise((resolve) => {
            audioRef.current.onloadedmetadata = () => {
              if (audioRef.current) {
                const duration = Math.floor(audioRef.current.duration);
                setMusicLength(duration);
                if (musicEnd > duration) {
                  setMusicEnd(duration);
                  setMusicDuration(duration - musicStart);
                }
                resolve();
              }
            };
          });
        }
        audioRef.current.currentTime = musicStart;
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentPlayingId(music.id);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        setCurrentPlayingId(null);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMusicStartChange = (e) => {
    const newStart = Number(e.target.value);
    const adjustedStart = Math.max(0, Math.min(newStart, musicEnd - 1));
    setMusicStart(adjustedStart);
    setMusicDuration(musicEnd - adjustedStart);
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = adjustedStart;
      setCurrentTime(adjustedStart);
    }
  };

  const handleMusicEndChange = (e) => {
    const newEnd = Number(e.target.value);
    const adjustedEnd = Math.min(musicLength, Math.max(newEnd, musicStart + 1));
    setMusicEnd(adjustedEnd);
    setMusicDuration(adjustedEnd - musicStart);
  };

  useEffect(() => {
    if (!audioRef.current) return;

    const updateTime = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.currentTime >= musicEnd) {
          audioRef.current.pause();
          audioRef.current.currentTime = musicStart;
          setIsPlaying(false);
          setCurrentPlayingId(null);
          setCurrentTime(musicStart);
        }
      }
    };

    audioRef.current.addEventListener('timeupdate', updateTime);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
      }
    };
  }, [musicStart, musicEnd, isPlaying]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      startLoading();
      const formData = new FormData();
      formData.append('media', selectedFile);
      if (selectedMusic) {
        formData.append('musicId', selectedMusic.id);
        formData.append('musicStart', Math.round(musicStart));
        formData.append('musicDuration', Math.round(musicDuration));
      }
      await onSubmit(formData);
      setSelectedFile(null);
      setPreview(null);
      setSelectedMusic(null);
      setMusicStart(0);
      setMusicEnd(30);
      setMusicDuration(30);
      setMusicLength(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setCurrentPlayingId(null);
      onClose();
    } catch (error) {
      console.error('Error submitting story:', error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full mx-4 p-6 max-h-[100vh] overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Đóng"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-white">
          Tạo Story Mới
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-row gap-6 h-[70vh]">
          {/* Left: File Input/Preview */}
          <div className="flex-1 flex flex-col">
            <div className="mb-5 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300"
                >
                  <itecture className="text-gray-500 dark:text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm">Chọn ảnh hoặc video</p>
                  </itecture>
                </button>
              ) : (
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  {selectedFile.type.startsWith('video/') ? (
                    <video src={preview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                    title="Xóa"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Music Selection and Controls */}
          <div className="flex-1 flex flex-col">
            {/* Music Selection */}
            <div className="mb-5 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Thêm Nhạc Nền (Tùy Chọn)
              </h3>

              {/* Selected Music Display with Dual Range Slider */}
              {selectedMusic && (
                <div className="mb-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div
                      className={`relative rounded-full overflow-hidden flex-shrink-0 border-4 border-blue-500 ${currentPlayingId === selectedMusic.id ? 'animate-spin' : ''}`}
                      style={{ animationDuration: '3s' }}
                    >
                      <img src={selectedMusic.thumbnail} alt={selectedMusic.title} className="w-16 h-16 object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{selectedMusic.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedMusic.artist}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handlePlayPause(selectedMusic, e)}
                        className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition transform hover:scale-110"
                        title={isPlaying && currentPlayingId === selectedMusic.id ? 'Tạm dừng' : 'Phát'}
                      >
                        {currentPlayingId === selectedMusic.id && isPlaying ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedMusic(null);
                          setCurrentTime(0);
                        }}
                        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition transform hover:scale-110"
                        title="Xóa nhạc"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative mt-6">
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="absolute h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-md"
                        style={{
                          left: `${(musicStart / musicLength) * 100}%`,
                          width: `${((musicEnd - musicStart) / musicLength) * 100}%`,
                        }}
                      />
                      {isPlaying && currentTime >= musicStart && currentTime <= musicEnd && (
                        <div
                          className="absolute h-4 w-1 bg-yellow-400 rounded-full shadow-md"
                          style={{
                            left: `${(currentTime / musicLength) * 100}%`,
                            transform: 'translateX(-50%)',
                          }}
                        />
                      )}
                    </div>
                    <style>{`
                      input[type="range"] {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 6px;
                        background: transparent;
                        position: absolute;
                        top: 0;
                        cursor: pointer;
                        z-index: 10;
                      }

                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb);
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        cursor: grab;
                        pointer-events: auto;
                        transition: transform 0.2s;
                        transform: translateY(-4px);
                      }

                      input[type="range"]::-webkit-slider-thumb:hover {
                        transform: translateY(-4px) scale(1.3);
                      }

                      input[type="range"]::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb);
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        cursor: grab;
                        pointer-events: auto;
                        transition: transform 0.2s;
                      }

                      input[type="range"]::-moz-range-thumb:hover {
                        transform: scale(1.3);
                      }

                      input[type="range"]::-webkit-slider-runnable-track {
                        height: 6px;
                        background: transparent;
                        border-radius: 9999px;
                      }

                      input[type="range"]::-moz-range-track {
                        height: 6px;
                        background: transparent;
                        border-radius: 9999px;
                      }
                    `}</style>

                    <input
                      type="range"
                      value={musicStart}
                      onChange={handleMusicStartChange}
                      min="0"
                      max={musicLength}
                      step="0.1"
                      className="w-full h-3"
                    />
                    <input
                      type="range"
                      value={musicEnd}
                      onChange={handleMusicEndChange}
                      min="0"
                      max={musicLength}
                      step="0.1"
                      className="w-full h-3"
                    />
                    <div className="flex justify-between mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatTime(musicStart)}</span>
                      <span>{formatTime(musicEnd)}</span>
                    </div>
                    {isPlaying && (
                      <div
                        className="absolute top-0 mt-[-24px] text-xs text-yellow-500 font-semibold bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded-lg shadow"
                        style={{ left: `${(currentTime / musicLength) * 100}%`, transform: 'translateX(-50%)' }}
                      >
                        {formatTime(currentTime)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Music List */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                {isLoadingMusics ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
                  </div>
                ) : musics.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Không có nhạc nào</div>
                ) : (
                  musics.map((music) => (
                    <div
                      key={music.id}
                      onClick={() => handleMusicSelect(music)}
                      className={`flex items-center p-3 cursor-pointer transition-all ${
                        selectedMusic?.id === music.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${currentPlayingId === music.id ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                          <img src={music.thumbnail} alt={music.title} className="w-10 h-10 object-cover" />
                          <button
                            type="button"
                            onClick={(e) => handlePlayPause(music, e)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          >
                            {currentPlayingId === music.id && isPlaying ? (
                              <PauseIcon className="w-5 h-5 text-white" />
                            ) : (
                              <PlayIcon className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{music.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{music.artist}</p>
                        </div>
                        {selectedMusic?.id === music.id && (
                          <div className="flex-shrink-0 text-blue-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                selectedFile
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Đăng Story
            </button>
          </div>

          <audio ref={audioRef} className="hidden" />
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;