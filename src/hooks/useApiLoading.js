import { useLoading } from '../contexts/LoadingContext';

export const useApiLoading = () => {
  const { showLoading, hideLoading } = useLoading();

  const startLoading = () => {
    showLoading();
  };

  const stopLoading = () => {
    hideLoading();
  };

  return { startLoading, stopLoading };
}; 