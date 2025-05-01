import React, { useState, useEffect } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { PhotoIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { postService } from '../services/postService';
import { useApiLoading } from '../hooks/useApiLoading';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, post = null, isEditMode = false }) => {
  const [postText, setPostText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const [error, setError] = useState(null);
  const { startLoading, stopLoading } = useApiLoading();

  useEffect(() => {
    if (isEditMode && post) {
      setPostText(post.content || '');
      setExistingMedia(post.media || []);
      setMediaFiles([]);
      setMediaToDelete([]);
    } else {
      setPostText('');
      setMediaFiles([]);
      setExistingMedia([]);
      setMediaToDelete([]);
    }
  }, [isEditMode, post, isOpen]);

  const handleSubmit = async () => {
    try {
      startLoading();
      if (isEditMode) {
        await postService.updatePost(post.id, postText, mediaFiles, mediaToDelete);
      } else {
        await postService.createPost(postText, mediaFiles);
      }
      setPostText('');
      setMediaFiles([]);
      setExistingMedia([]);
      setMediaToDelete([]);
      setError(null);
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Lỗi khi cập nhật bài viết' : 'Lỗi khi tạo bài viết'));
    } finally {
      stopLoading();
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveExistingMedia = (mediaId, fileUrl) => {
    setExistingMedia(existingMedia.filter((media) => media.media.id !== mediaId));
    setMediaToDelete([...mediaToDelete, fileUrl]);
  };

  const renderMediaPreview = (file, index, isExisting = false) => {
    const fileType = isExisting ? file.media.url.split('.').pop().toLowerCase() : file.type.split('/')[0];
    const fileUrl = isExisting ? file.media.url : URL.createObjectURL(file);
    const mediaId = isExisting ? file.media.id : index;

    return (
      <div key={`${mediaId}-${isExisting ? 'existing' : 'new'}`} className="relative w-24 h-24 mr-2 mb-2 rounded-lg overflow-hidden shadow-sm">
        {fileType === 'image' || fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png' ? (
          <img src={fileUrl} alt={`Preview ${mediaId}`} className="w-full h-full object-cover" />
        ) : (
          <video src={fileUrl} controls className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => (isExisting ? handleRemoveExistingMedia(mediaId, fileUrl) : handleRemoveFile(index))}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
          aria-label="Xóa tệp"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full transform transition-all duration-300 animate-modal-open">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Đóng"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Textarea */}
          <textarea
  as="textarea"
  rows="6"
  placeholder={isEditMode ? 'Chỉnh sửa nội dung bài viết...' : 'Bạn đang nghĩ gì thế nhỉ?'}
  value={postText}
  onChange={(e) => setPostText(e.target.value)}
  className="w-full pt-0.5 pr-3 pb-3 pl-3 border-2 border-gray-200 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500  resize-none min-h-40 transition-all duration-200"
/>


          {/* Media Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh/Video:</h3>
            <div className="flex flex-wrap items-center">
              {/* File Upload */}
              <label className="inline-flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-600 p-2 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 w-24 h-24 mr-2 mb-2">
                <PhotoIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="text-blue-500 dark:text-blue-400 font-medium">
                +
              </span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </label>

              {/* Media Preview */}
              {existingMedia.map((media, index) => renderMediaPreview(media, index, true))}
              {mediaFiles.map((file, index) => renderMediaPreview(file, index))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="text-sm"
            />
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isEditMode ? 'Lưu thay đổi' : 'Đăng ngay!'}
            </Button>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes modalOpen {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modal-open {
          animation: modalOpen 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreatePostModal;