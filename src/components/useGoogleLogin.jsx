import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useGoogleLogin = (setError, setSuccessMessage, setIsGoogleLoading) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const accessToken = query.get('accessToken');
    const refreshToken = query.get('refreshToken');
    const user = query.get('user');
    const error = query.get('error');

    if (error) {
      setError(decodeURIComponent(error));
      setIsGoogleLoading(false);
      return;
    }

    if (accessToken && refreshToken && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        setSuccessMessage('Đăng nhập bằng Google thành công!');
        setTimeout(() => navigate('/home'), 500);
      } catch (error) {
        setError('Lỗi xử lý đăng nhập Google');
        setIsGoogleLoading(false);
      }
    }
  }, [location, navigate, setError, setSuccessMessage, setIsGoogleLoading]);
};

export default useGoogleLogin;