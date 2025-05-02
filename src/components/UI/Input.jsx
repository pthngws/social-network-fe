import React from 'react';

const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
  maxLength,
  className = '',
  ...props
}) => {
  return (
    <div className="flex-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 text-left"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-gray-100 transition-colors duration-300 text-base ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;