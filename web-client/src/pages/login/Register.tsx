import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Form, Input, Typography, Alert, message } from 'antd';
import axios from 'axios';
import AddressSelector from '@/components/AddressSelector';
// Giả định URL API được cấu hình trong biến môi trường VITE_API_URL

const { Title } = Typography;

// Mock type cho môi trường này
interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    username: string;
    role: 'admin' | 'user';
  };
}


const Register: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Định nghĩa hàm xử lý đăng ký
  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError('');
    
    // Tạo payload API, đảm bảo có password_confirmation
    const payload = {
      name: values.name,
      username: values.username,
      password: values.password,
      password_confirmation: values.password_confirmation,
      phone_number: values.phone_number,
      address: values.address,
    };

    try {
      // --------------------------------------------------
      // 👇 GỌI API ĐĂNG KÝ THỰC TẾ
      // --------------------------------------------------
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/register`, // Endpoint thực tế trong Laravel
        payload
      );
      
      // --------------------------------------------------
      // 👆 KẾT THÚC GỌI API THỰC TẾ
      // --------------------------------------------------
      
      const { access_token, user } = response.data;
      
      // Lưu token và thông tin user vào localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success('Đăng ký thành công! Bạn đã được đăng nhập.');
      navigate('/user/dashboard'); // Chuyển hướng đến trang dashboard người dùng
      
    } catch (err: any) {
      console.error("Registration Error:", err);
      let errorMessage = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      
      // Xử lý lỗi validation từ Laravel (thường là status 422)
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        // Lấy lỗi đầu tiên để hiển thị
        errorMessage = Object.values(errors).flat()[0] as string || errorMessage;
      } else if (err.response?.data?.message) {
        // Xử lý các lỗi khác có message
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Xử lý lỗi mạng
        errorMessage = 'Lỗi kết nối: Không thể kết nối đến máy chủ API.';
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <Title level={2} className="text-center mb-6 text-green-600">Đăng Ký Tài Khoản Mới</Title>
        
        {error && <Alert message={error} type="error" showIcon className="mb-4" />}
        
        <Form 
          form={form}
          onFinish={handleSubmit} 
          layout="vertical"
          scrollToFirstError
        >
          {/* Tên đầy đủ */}
          <Form.Item 
            label="Tên đầy đủ"
            name="name" 
            rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}
          >
            <Input size="large" placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>

          {/* Tài khoản (Username) */}
          <Form.Item 
            label="Tên đăng nhập"
            name="username" 
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input size="large" placeholder="Tên đăng nhập duy nhất" />
          </Form.Item>
          
          {/* Mật khẩu */}
          <Form.Item 
            label="Mật khẩu"
            name="password" 
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' }
            ]}
          >
            <Input.Password size="large" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" />
          </Form.Item>

          {/* Xác nhận mật khẩu */}
          <Form.Item
            label="Xác nhận mật khẩu"
            name="password_confirmation"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          {/* Số điện thoại (Tùy chọn) */}
          <Form.Item 
            label="Số điện thoại (Tùy chọn)"
            name="phone_number" 
          rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}>
            <Input size="large" placeholder="Số điện thoại liên hệ" />
          </Form.Item>

          {/* Địa chỉ (Tùy chọn) */}
          <Form.Item
            label="Dia chi"
            name="address"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
          >
            <AddressSelector />
          </Form.Item>
          
          {/* Nút Đăng Ký */}
          <Form.Item className="mb-4 mt-6">
            <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                size="large"
                className="bg-green-600 hover:bg-green-700 transition-colors font-bold"
            >
                Đăng Ký
            </Button>
          </Form.Item>
          
          {/* Liên kết quay lại đăng nhập */}
          <div className="text-center">
            <Link to="/login" className="text-blue-500 hover:text-blue-700">
              Đã có tài khoản? Quay lại Đăng nhập
            </Link>
          </div>

        </Form>
      </div>
    </div>
  );
};

export default Register;
