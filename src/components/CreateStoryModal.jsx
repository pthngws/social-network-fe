import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { storyService } from '../services/storyService';

const CreateStoryModal = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musics, setMusics] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMusics();
    } else {
      // Reset states when modal closes
      setSelectedFile(null);
      setPreview(null);
      setSelectedMusic(null);
      setIsPlaying(false);
      setCurrentPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isOpen]);

  const loadMusics = async () => {
    try {
      const response = await storyService.getAllMusics();
      if (response.data.status === 200) {
        setMusics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading musics:', error);
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
    // Automatically play the selected music
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingId(music.id);
    }
  };

  const handlePlayPause = (music, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!audioRef.current) return;

    if (currentPlayingId === music.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    } else {
      if (currentPlayingId !== music.id) {
        audioRef.current.src = music.url;
      }
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingId(music.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('media', selectedFile);
    if (selectedMusic) {
      formData.append('musicId', selectedMusic.id);
    }

    onSubmit(formData);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Tạo story mới
        </h2>

        <form onSubmit={handleSubmit}>
          {/* File Input */}
          <div className="mb-4">
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
                className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>Click để chọn ảnh hoặc video</p>
                </div>
              </button>
            ) : (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
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
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Music Selection */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chọn nhạc nền (không bắt buộc)
            </h3>

            {/* Selected Music Display */}
            {selectedMusic && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${
                    currentPlayingId === selectedMusic.id ? 'animate-spin' : ''
                  }`} style={{ animationDuration: '3s' }}>
                    <img
                      src={selectedMusic.thumbnail}
                      alt={selectedMusic.title}
                      className="w-14 h-14 object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      Nhạc đã chọn
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedMusic.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedMusic.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePlayPause(selectedMusic, e);
                      }}
                      className="p-2 rounded-full bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700"
                    >
                      {currentPlayingId === selectedMusic.id && isPlaying ? (
                        <PauseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <PlayIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedMusic(null);
                      }}
                      className="p-2 rounded-full bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700"
                    >
                      <XMarkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Music List */}
            <div className="flex flex-col divide-y dark:divide-gray-700 max-h-48 overflow-y-auto">
              {musics.map((music) => (
                <div
                  key={music.id}
                  onClick={() => handleMusicSelect(music)}
                  className={`flex items-center p-2 cursor-pointer transition-all ${
                    selectedMusic?.id === music.id
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${
                      currentPlayingId === music.id ? 'animate-spin' : ''
                    }`} style={{ animationDuration: '3s' }}>
                      <img
                        src={music.thumbnail}
                        alt={music.title}
                        className="w-12 h-12 object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => handlePlayPause(music, e)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {currentPlayingId === music.id && isPlaying ? (
                          <PauseIcon className="w-6 h-6 text-white" />
                        ) : (
                          <PlayIcon className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {music.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {music.artist}
                      </p>
                    </div>
                    {selectedMusic?.id === music.id && (
                      <div className="flex-shrink-0 text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <audio ref={audioRef} className="hidden" />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              selectedFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            } transition-colors`}
          >
            Đăng story
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal; 