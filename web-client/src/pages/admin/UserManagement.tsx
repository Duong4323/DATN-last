import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from "antd";
import { getUsers, createUser, updateUser, deleteUser } from "@/api/users";

// Cập nhật interface để đồng bộ với Backend
interface User {
  id: number;
  name: string;
  username: string; // Sử dụng username thay vì email
  phone_number?: string; // Trường mới
  address?: string;      // Trường mới
  role?: 'admin' | 'user';
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Giả định API trả về các trường 'username', 'phone_number', 'address'
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Fetch users error:", error);
      message.error("Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý thêm mới
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Xử lý chỉnh sửa
  const handleEdit = (record: User) => {
    setEditingUser(record);
    // Lưu ý: Không set giá trị password vào form khi chỉnh sửa
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // Xử lý xóa
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success("Đã xóa người dùng!");
      fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      message.error("Xóa thất bại!");
    }
  };

  // Gửi form (thêm/sửa)
  const handleSubmit = async (values: any) => {
    try {
      // Xóa password nếu là cập nhật và trường password trống
      if (editingUser && !values.password) {
        delete values.password;
      }
      
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("Cập nhật thành công!");
      } else {
        await createUser(values);
        message.success("Thêm người dùng thành công!");
      }

      fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      // Thường lỗi validation từ Laravel sẽ trả về 422, bạn cần xử lý lỗi này
      console.error("Submit error:", error);
      message.error("Thao tác thất bại! Kiểm tra lại dữ liệu nhập.");
    }
  };

  const roleOptions = [
    { value: 'user', label: 'Người dùng' },
    { value: 'admin', label: 'Quản trị viên' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">👥 Quản lý người dùng</h2>
        <Button type="primary" onClick={handleAdd}>
          + Thêm người dùng
        </Button>
      </div>

      <Table
        dataSource={users}
        loading={loading}
        rowKey="id"
        bordered
        pagination={{ pageSize: 8 }}
        columns={[
          { title: "ID", dataIndex: "id", key: "id", width: 80 },
          { title: "Tên", dataIndex: "name", key: "name" },
          { title: "Tài khoản", dataIndex: "username", key: "username" }, // Đã đổi từ Email
          { title: "SĐT", dataIndex: "phone_number", key: "phone_number" }, // Trường mới
          { title: "Địa chỉ", dataIndex: "address", key: "address" },      // Trường mới
          { title: "Vai trò", dataIndex: "role", key: "role" },
          {
            title: "Hành động",
            key: "actions",
            render: (_, record) => (
              <div className="flex gap-2">
                <Button onClick={() => handleEdit(record)}>Sửa</Button>
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger>Xóa</Button>
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Tên người dùng */}
          <Form.Item
            label="Tên đầy đủ"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input />
          </Form.Item>

          {/* Tài khoản (Username) */}
          <Form.Item
            label="Tài khoản (Username)"
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên tài khoản!" },
            ]}
          >
            <Input disabled={!!editingUser} /> {/* Không cho sửa username khi edit */}
          </Form.Item>
          
          {/* Số điện thoại */}
          <Form.Item
            label="Số điện thoại"
            name="phone_number"
            rules={[{ max: 20, message: "Tối đa 20 ký tự." }]}
          >
            <Input />
          </Form.Item>

          {/* Địa chỉ */}
          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ max: 500, message: "Tối đa 500 ký tự." }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          {/* Mật khẩu */}
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: !editingUser, message: "Mật khẩu là bắt buộc khi tạo mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự." }
            ]}
            help={editingUser ? "Để trống nếu không muốn thay đổi mật khẩu." : null}
          >
            <Input.Password />
          </Form.Item>

          {/* Vai trò */}
          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          >
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;