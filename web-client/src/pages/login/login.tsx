import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Typography, Alert, message } from 'antd';
import axios from 'axios';
import 'antd/dist/reset.css';

import { setupAxiosInterceptors } from '@/axiosConfig';

const { Title } = Typography;

interface LoginResponse {
    access_token: string;
    user: {
        id: number;
        name: string;
        username: string;
        role: 'admin' | 'user' | 'shop_owner';
    };
}

const Login: React.FC = () => {
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const redirectByRole = (role: 'admin' | 'user' | 'shop_owner') => {
        if (role === 'admin') {
            navigate('/admin/dashboard');
            return;
        }

        if (role === 'shop_owner') {
            navigate('/shop/dashboard');
            return;
        }

        navigate('/user/dashboard');
    };

    const handleSubmit = async (values: { username: string; password: string }) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post<LoginResponse>(
                `${import.meta.env.VITE_API_URL}/auth/login`,
                {
                    username: values.username,
                    password: values.password,
                }
            );

            const { access_token, user } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            setupAxiosInterceptors();

            message.success('Đăng nhập thành công!');

            redirectByRole(user.role);

        } catch (err: any) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Sai tên đăng nhập hoặc mật khẩu.';

            setError(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <Title level={2} className="text-center mb-6 text-blue-600">
                    Đăng Nhập
                </Title>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        className="mb-4"
                    />
                )}

                <Form onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên đăng nhập!',
                            },
                        ]}
                    >
                        <Input placeholder="Tên đăng nhập" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu!',
                            },
                        ]}
                    >
                        <Input.Password placeholder="Mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item className="mb-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={loading}
                            className="bg-blue-600 hover:bg-blue-700 transition-colors font-bold"
                        >
                            Đăng Nhập
                        </Button>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="default"
                            onClick={handleRegisterClick}
                            block
                            size="large"
                            className="border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 transition-colors"
                        >
                            Đăng Ký Tài Khoản Mới
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Login;