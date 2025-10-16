import React, { useState, useEffect } from 'react';
import { storyService } from '../services/storyService';
import Card from './UI/Card';
import Input from './UI/Input';
import Button from './UI/Button';
import Alert from './UI/Alert';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useApiLoading } from '../hooks/useApiLoading';

const StoryUploader = () => {
  const [mediaFile, setMediaFile] = useState(null);
  const [musicId, setMusicId] = useState('');
  const [musicStart, setMusicStart] = useState(0);
  const [musicDuration, setMusicDuration] = useState(30);
  const [musics, setMusics] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState(null);
  const [showInteractions, setShowInteractions] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [storyId, setStoryId] = useState(null);
  const { startLoading, stopLoading } = useApiLoading();

  useEffect(() => {
    // Fetch available background musics
    const fetchMusics = async () => {
      try {
        const response = await storyService.getAllMusics();
        setMusics(response.data.data || []);
      } catch (err) {
        setError('Lỗi tải danh sách nhạc nền');
      }
    };
    fetchMusics();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setMediaFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      setError('Vui lòng chọn ảnh hoặc video');
      return;
    }

    try {
      startLoading();
      const formData = new FormData();
      formData.append('media', mediaFile);
      if (musicId) {
        formData.append('musicId', musicId);
        formData.append('musicStart', musicStart);
        formData.append('musicDuration', musicDuration);
      }

      const response = await storyService.createStory(formData);
      if (response.data.status === 200) {
        setStoryId(response.data.data.id);
        handleRemoveFile();
        setMusicId('');
        setMusicStart(0);
        setMusicDuration(30);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đăng story');
    } finally {
      stopLoading();
    }
  };

  const handleViewInteractions = async () => {
    if (!storyId) return;

    try {
      startLoading();
      const response = await storyService.getStoryInteractions(storyId);
      if (response.data.status === 200) {
        setInteractions(response.data.data);
        setShowInteractions(true);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách tương tác');
    } finally {
      stopLoading();
    }
  };

  const renderMediaPreview = () => {
    if (!previewUrl) return null;

    const isVideo = mediaFile?.type.startsWith('video/');
    return (
      <div className="relative w-full h-48 mb-4">
        {isVideo ? (
          <video src={previewUrl} controls className="w-full h-full object-cover rounded-lg" />
        ) : (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        )}
        <button
          onClick={handleRemoveFile}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
          aria-label="Xóa tệp"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <Card className="mb-4">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Đăng Story
        </h3>

        {/* Media Upload */}
        {!mediaFile ? (
          <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200">
            <div className="flex flex-col items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Chọn ảnh hoặc video
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          renderMediaPreview()
        )}

        {/* Music Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chọn nhạc nền (không bắt buộc)
          </label>
          <select
            value={musicId}
            onChange={(e) => setMusicId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Không có nhạc nền</option>
            {musics.map((music) => (
              <option key={music.id} value={music.id}>
                {music.name}
              </option>
            ))}
          </select>
        </div>

        {/* Music Timing Sliders */}
        {musicId && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thời gian bắt đầu: {musicStart} giây
              </label>
              <input
                type="range"
                value={musicStart}
                onChange={(e) => setMusicStart(Number(e.target.value))}
                min="0"
                max="120"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thời lượng: {musicDuration} giây
              </label>
              <input
                type="range"
                value={musicDuration}
                onChange={(e) => setMusicDuration(Number(e.target.value))}
                min="1"
                max="60"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mt-4"
          />
        )}

        {/* Upload Button */}
        <Button
          variant="primary"
          onClick={handleSubmit}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Đăng Story
        </Button>

        {/* View Interactions Button */}
        {storyId && (
          <Button
            variant="secondary"
            onClick={handleViewInteractions}
            className="w-full mt-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Xem lượt tương tác
          </Button>
        )}

        {/* Interactions List */}
        {showInteractions && interactions.length > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Danh sách tương tác
            </h4>
            <div className="space-y-2">
              {interactions.map((interaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      User ID: {interaction.userId}
                    </span>
                    {interaction.reactionType && (
                      <span className="ml-2 text-sm text-blue-500">
                        {interaction.reactionType}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(interaction.interactedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StoryUploader;