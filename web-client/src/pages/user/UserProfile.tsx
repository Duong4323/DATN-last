import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Input, Typography, Alert, message, Card, Skeleton, Upload } from 'antd';
import { LoadingOutlined, UserOutlined } from '@ant-design/icons';
// 💡 Cập nhật import: Thêm hàm uploadProfileImage vào đây
import { getUserById, updateUser, uploadProfileImage } from '@/api/users'; 
import AddressSelector from '@/components/AddressSelector';

const { Title } = Typography;

// Định nghĩa kiểu dữ liệu User (giữ nguyên)
interface User {
  id: number;
  name: string;
  username: string;
  phone_number: string | null;
  address: string | null;
  role: string;
  profile_image_url: string | null;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [form] = Form.useForm();

  // Trạng thái cho việc tải ảnh (Upload)
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // State riêng cho URL ảnh sau khi upload

  // Lấy ID người dùng từ localStorage
  const storedUser = localStorage.getItem('user');
  const currentUserId = storedUser ? JSON.parse(storedUser).id : null;
  
  /**
   * Tải thông tin người dùng từ API
   */
  const fetchUserProfile = useCallback(async () => {
    // ... (Logic giữ nguyên)
    if (!currentUserId) {
      setError('Bạn chưa đăng nhập.');
      setLoading(false);
      return;
    }

    try {
      const userData: User = await getUserById(currentUserId); 
      
      setUser(userData);
      setImageUrl(userData.profile_image_url); // Đặt ảnh hiện tại
      
      // Gán dữ liệu vào Form
      form.setFieldsValue({
        name: userData.name,
        username: userData.username,
        phone_number: userData.phone_number,
        address: userData.address,
        new_password: undefined, 
        password_confirmation: undefined,
      });

    } catch (err: any) {
      console.error("Fetch User Error:", err);
      setError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, form]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  /**
   * Xử lý tải ảnh lên Server (Sử dụng hàm từ api/users.ts)
   */
  const handleImageUpload = async (file: File) => {
    // Validation phía client (giữ nguyên)
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Bạn chỉ có thể tải lên tệp JPG/PNG!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Ảnh phải nhỏ hơn 2MB!');
      return Upload.LIST_IGNORE;
    }

    setIsUploadingImage(true);
    try {
        // 🎯 GỌI HÀM MỚI: uploadProfileImage từ api/users.ts
        const newUrl = await uploadProfileImage(file); 
        setImageUrl(newUrl); // Cập nhật URL ảnh mới
        message.success('Tải ảnh lên thành công! Nhấn "Cập nhật thông tin" để lưu.');
        return newUrl; // Trả về URL thành công
    } catch (e: any) {
        // Xử lý lỗi từ API service
        console.error("Upload Error:", e.message || e);
        message.error(e.message || 'Tải ảnh lên thất bại.');
        return Upload.LIST_IGNORE;
    } finally {
        setIsUploadingImage(false);
    }
  };


  /**
   * Xử lý khi Form được submit (Cập nhật thông tin)
   */
  const handleUpdate = async (values: any) => {
    if (!currentUserId) {
        message.error('Lỗi xác thực. Vui lòng đăng nhập lại.');
        return;
    }
    
    setSubmitting(true);
    setError('');

    // Tạo payload (giữ nguyên)
    const payload: any = {
        name: values.name,
        phone_number: values.phone_number,
        address: values.address,
        profile_image_url: imageUrl, // <-- GỬI URL MỚI NHẤT
    };
    
    // Thêm password (giữ nguyên)
    if (values.new_password) {
        payload.password = values.new_password;
        payload.password_confirmation = values.password_confirmation; 
    }

    try {
      await updateUser(currentUserId, payload);
      
      message.success('Cập nhật thông tin thành công!');
      fetchUserProfile();

    } catch (err: any) {
      // Xử lý lỗi (giữ nguyên)
      console.error("Update Error:", err);
      let errorMessage = 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.';
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat()[0] as string || errorMessage;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      
    } finally {
      setSubmitting(false);
    }
  };

  // Hiển thị Avatar (Ảnh đại diện)
  const uploadButton = (
    <div>
      {isUploadingImage ? <LoadingOutlined /> : <UserOutlined />}
      <div style={{ marginTop: 8 }}>{isUploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card title={<Title level={3}>Thông tin cá nhân</Title>}>
          <Skeleton active avatar />
        </Card>
      </div>
    );
  }

  if (error && !user) {
    return <Alert message="Lỗi" description={error} type="error" showIcon className="max-w-md mx-auto mt-10" />;
  }

  return (
    <div className="p-8 min-h-screen bg-gray-100 flex justify-center items-start">
      <Card title={<Title level={3} className="text-blue-600">Thông tin cá nhân</Title>} className="shadow-2xl w-full max-w-2xl mt-10">
        
        {error && <Alert message={error} type="error" showIcon className="mb-4" />}
        
        <Form 
          form={form}
          onFinish={handleUpdate} 
          layout="vertical"
          initialValues={user || {}}
          scrollToFirstError
        >
          {/* PHẦN TẢI ẢNH NGƯỜI DÙNG */}
          <div className="flex flex-col items-center mb-6">
            <Title level={4}>Ảnh Đại diện (Profile Image)</Title>
            <Form.Item name="profile_image_upload" className="mb-0">
                <Upload
                    name="avatar"
                    listType="picture-circle"
                    className="avatar-uploader"
                    showUploadList={false}
                    customRequest={({ file, onSuccess }) => {
                        handleImageUpload(file as File).then((url) => {
                             if (url && onSuccess) onSuccess(url);
                        });
                    }}
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                        uploadButton
                    )}
                </Upload>
            </Form.Item>
            {imageUrl && !isUploadingImage && <Button type="link" danger onClick={() => setImageUrl(null)} className="mt-2">Xóa ảnh</Button>}
          </div>
          {/* KẾT THÚC PHẦN TẢI ẢNH */}


          {/* Tên đăng nhập (Chỉ hiển thị) */}
          <Form.Item 
            label="Tên đăng nhập"
            name="username"
          >
            <Input size="large" disabled className="bg-gray-100 cursor-not-allowed" />
          </Form.Item>
          
          <div className="border-t pt-4 mt-4">
              <Title level={4}>Cập nhật thông tin cơ bản</Title>
          </div>
          
          {/* Tên đầy đủ */}
          <Form.Item 
            label="Tên đầy đủ"
            name="name" 
            rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}
          >
            <Input size="large" placeholder="Tên đầy đủ" />
          </Form.Item>

          {/* Số điện thoại */}
          <Form.Item 
            label="Số điện thoại"
            name="phone_number" 
            rules={[{ required: true, message: 'Vui lòng nhập sdt của bạn!' }]}
          >
            <Input size="large" placeholder="Số điện thoại liên hệ" />
          </Form.Item>

          {/* Địa chỉ */}
          <Form.Item
            label="Dia chi"
            name="address"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ của bạn!" }]}
          >
            <AddressSelector />
          </Form.Item>
          
          {/* Thay đổi Mật khẩu */}
          <div className="border-t pt-4 mt-4">
              <Title level={4}>Thay đổi Mật khẩu</Title>
              <Alert 
                  message="Chỉ nhập nếu bạn muốn thay đổi mật khẩu hiện tại." 
                  type="info" 
                  showIcon 
                  className="mb-4"
              />
          </div>
          
          <Form.Item 
            label="Mật khẩu mới"
            name="new_password" 
            rules={[{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' }]}
          >
            <Input.Password size="large" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="password_confirmation"
            dependencies={['new_password']}
            hasFeedback
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const newPassword = getFieldValue('new_password');
                  if (!newPassword && !value) {
                      return Promise.resolve();
                  }
                  if (newPassword && newPassword === value) {
                    return Promise.resolve();
                  }
                  if (newPassword && !value) {
                      return Promise.reject(new Error('Vui lòng xác nhận mật khẩu mới!'));
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
          
          {/* Nút Cập nhật */}
          <Form.Item className="mt-8">
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={submitting || isUploadingImage} 
              size="large"
              className="bg-blue-600 hover:bg-blue-700 transition-colors font-bold"
            >
              Cập nhật thông tin
            </Button>
          </Form.Item>

        </Form>
      </Card>
    </div>
  );
};

export default UserProfile;
