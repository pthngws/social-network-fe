import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 transition-opacity duration-300">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100 sm:scale-105 opacity-100 animate-modal-open"
      >


        {/* Content */}
        <div className="p-6">{children}</div>
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

export default Modal;