import React, { useEffect, useState } from "react";
import CheckCircleIcon from "@heroicons/react/24/solid/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/solid/XCircleIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

// Define icons for success and error states
const icons = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-300" />,
  error: <XCircleIcon className="h-6 w-6 text-red-500 dark:text-red-300" />,
};

const Alert = ({ message, type = "success", duration = 4000, onClose }) => {
  const [show, setShow] = useState(true);

  // Handle auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Hide component if not shown
  if (!show) return null;

  // Base styles for the alert
  const baseStyle =
    "fixed top-20 right-6 w-80 sm:w-96 p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform"; // Changed top-12 to top-16

  // Type-specific styles with vibrant colors and cleaner shadow
  const typeStyles = {
    success: "bg-green-50 text-gray-800 border-l-4 border-green-500 dark:bg-green-900/90 dark:text-gray-100 dark:border-green-300",
    error: "bg-red-50 text-gray-800 border-l-4 border-red-500 dark:bg-red-900/90 dark:text-gray-100 dark:border-red-300",
  };

  // Tailwind CSS animation for slide-in with a slight bounce
  const slideInAnimation = `
    @keyframes slideInRight {
      0% { transform: translateX(100%); opacity: 0; }
      80% { transform: translateX(-5%); opacity: 1; }
      100% { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in-right {
      animation: slideInRight 0.4s ease-out;
    }
  `;

  return (
    <>
      {/* Inject custom animation styles */}
      <style>{slideInAnimation}</style>
      <div
        className={`${baseStyle} ${typeStyles[type]} animate-slide-in-right backdrop-blur-sm`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
          {/* Message */}
          <div className="flex-1 text-sm font-semibold break-words">
            {message}
          </div>
          {/* Close Button */}
          <button
            onClick={() => {
              setShow(false);
              if (onClose) onClose();
            }}
            className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors duration-150"
            aria-label="Close alert"
          >
            <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-200" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Alert;