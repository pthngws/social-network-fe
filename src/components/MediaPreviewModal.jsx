import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const MediaPreviewModal = ({ isOpen, onClose, mediaUrl, mediaType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
          aria-label="Đóng"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>
        
        <div className="bg-black rounded-lg overflow-hidden">
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt="Preview"
              className="w-full h-full object-contain max-h-[90vh]"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain max-h-[90vh]"
              autoPlay
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewModal; 