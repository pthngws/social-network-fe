import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import { login } from '../services/authService';
import validateLoginInputs from '../components/validateInputs';
import { useAuthContext } from '../contexts/AuthContext';

const BACKEND_URL = 'https://wsproject-5eb9.onrender.com'; // Backend URL

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuthContext();

  // Handle OAuth2 callback for Google login
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');
      const oauth2Success = urlParams.get('oauth2');

      console.log('URL Params:', { error, oauth2Success });

      if (error) {
        setAlert({ show: true, type: 'error', message: 'Đăng nhập Google thất bại.' });
        return;
      }

      if (location.pathname === '/login' && oauth2Success === 'success') {
        try {
          console.log('Fetching OAuth token from', `${BACKEND_URL}/auth/oauth2-login`);
          const response = await fetch(`${BACKEND_URL}/auth/oauth2-login`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          const data = await response.json();
          console.log('OAuth Response:', data);

          if (data.status === 200 && data.data) {
            const { token, email, id } = data.data; // Điều chỉnh nếu id là userId
            if (token && email && id) {
              localStorage.setItem('token', token);
              localStorage.setItem('email', email);
              localStorage.setItem('userId', id);
              console.log('Stored in localStorage:', { token, email, userId: id });
              setAlert({
                show: true,
                type: 'success',
                message: 'Đăng nhập Google thành công! Đang chuyển hướng...',
              });
              
              // Immediately refresh auth state and navigate
              await refreshAuth();
              navigate('/home');
            } else {
              console.error('Missing fields in UserDto:', data.data);
              setAlert({
                show: true,
                type: 'error',
                message: 'Dữ liệu đăng nhập Google không đầy đủ.',
              });
            }
          } else {
            setAlert({
              show: true,
              type: 'error',
              message: data.message || 'Không thể lấy thông tin đăng nhập Google.',
            });
          }
        } catch (error) {
          console.error('Lỗi khi gọi API OAuth:', error);
          setAlert({
            show: true,
            type: 'error',
            message: 'Lỗi trong quá trình đăng nhập Google: ' + error.message,
          });
        }
      }
    };

    handleOAuthCallback();
  }, [location, navigate, refreshAuth]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ show: false, type: '', message: '' });

    if (!validateLoginInputs(formData.email, formData.password, (message) =>
      setAlert({ show: true, type: 'error', message }))) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(formData);
      console.log('Login Response:', response.data);
      const { data } = response.data;
      if (data && data.token && data.email && data.id) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('userId', data.id); // Điều chỉnh nếu là userId
        
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        console.log('Stored in localStorage:', {
          token: data.token,
          email: data.email,
          userId: data.id,
        });
        
        setAlert({
          show: true,
          type: 'success',
          message: 'Đăng nhập thành công! Đang chuyển hướng...',
        });
        
        // Refresh auth state and navigate immediately
        await refreshAuth();
        navigate('/home');
      } else {
        throw new Error('Dữ liệu đăng nhập không đầy đủ');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      const message = error.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      setAlert({ show: true, type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setAlert({ show: false, type: '', message: '' });
    console.log('Redirecting to Google OAuth:', `${BACKEND_URL}/oauth2/authorization/google`);
    window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
  };

  return (
    <div className=" min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Đăng nhập
        </h2>
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ ...alert, show: false })}
            className="mb-4"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              name="email"
              placeholder="Nhập email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || isGoogleLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mật khẩu
            </label>
            <Input
              type="password"
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading || isGoogleLoading}
              required
            />
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={isGoogleLoading}
          >
            Đăng nhập
          </Button>
          <Button
            variant="secondary"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-1.01 7.28-2.73l-3.57-2.77c-1.02.68-2.33 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.39 7.69 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.69 1 4.01 3.61 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 616-4.53z" fill="#EA4335" />
            </svg>
            Đăng nhập bằng Google
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;