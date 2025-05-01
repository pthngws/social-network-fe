import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  let loadingCount = 0;

  const showLoading = () => {
    if (loadingCount === 0) {
      setIsLoading(true);
    }
    loadingCount += 1;
  };

  const hideLoading = () => {
    loadingCount -= 1;
    if (loadingCount <= 0) {
      setIsLoading(false);
      loadingCount = 0; // Đảm bảo không âm
    }
  };

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);