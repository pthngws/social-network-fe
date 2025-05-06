import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { register, verifyOtp } from "../services/authService";
import Modal from "../components/ui/Modal"; // Nếu bạn chưa có Modal, mình có thể viết cho

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [otp, setOtp] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, password, confirmPassword } = formData;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlert({ show: true, type: "error", message: "Định dạng email không hợp lệ." });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setAlert({ show: true, type: "error", message: "Mật khẩu phải dài ít nhất 6 ký tự." });
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setAlert({ show: true, type: "error", message: "Mật khẩu không khớp." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({ email, password });
      if (response.data.status === 200) {
        setAlert({
          show: true,
          type: "success",
          message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy OTP."
        });
        setIsOtpModalOpen(true);
      } else {
        setAlert({
          show: true,
          type: "error",
          message: response.data.message || "Đăng ký thất bại."
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const response = await verifyOtp(formData.email, otp);
      if (response.data.status === 200) {
        setAlert({ show: true, type: "success", message: "Xác thực OTP thành công! Đang chuyển hướng..." });
        navigate("/login");
      } else {
        setAlert({ show: true, type: "error", message: response.data.message || "Mã OTP không hợp lệ." });
      }
    } catch (error) {
      console.error("Error:", error);
      setAlert({ show: true, type: "error", message: error.response?.data?.message || "Xác thực OTP thất bại." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Đăng ký
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
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nhập lại mật khẩu
            </label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Đăng ký
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </Card>

      {/* Modal nhập OTP */}
      {isOtpModalOpen && (
        <Modal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} title="Xác thực OTP">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={handleVerifyOtp}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Xác thực OTP
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Register;
