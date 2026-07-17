import React, { useEffect, useState } from "react";

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
} from "antd";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/api/users";
import AddressSelector from "@/components/AddressSelector";

interface Shop {
  id: number;
  name: string;
  logo_url?: string;
  description?: string;
  address?: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  phone_number?: string;
  address?: string;
  role?: "admin" | "user" | "shop_owner";
  shop?: Shop | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Quan tri vien Admin",
  shop_owner: "Chủ cửa hàng",
  user: "Nguoi dung",
};

const normalizeSearchText = (value: unknown) => String(value ?? "").toLowerCase();

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);

    try {
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

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();

    form.setFieldsValue({
      role: "user",
    });

    setIsModalOpen(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);

    form.setFieldsValue({
      ...record,
      shop_name: record.shop?.name,
      shop_logo_url: record.shop?.logo_url,
      shop_description: record.shop?.description,
      shop_address: record.shop?.address,
    });

    setIsModalOpen(true);
  };

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

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser && !values.password) {
        delete values.password;
      }

      if (values.role !== "shop_owner") {
        delete values.shop_name;
        delete values.shop_logo_url;
        delete values.shop_description;
        delete values.shop_address;
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
      form.resetFields();
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Thao tác thất bại! Kiểm tra lại dữ liệu nhập.");
    }
  };

  const roleOptions = [
    {
      value: "user",
      label: "Người dùng",
    },
    {
      value: "shop_owner",
      label: "Chủ cửa hàng",
    },
    {
      value: "admin",
      label: "Quản trị viên",
    },
  ];

  const renderRole = (role?: string) => {
    switch (role) {
      case "admin":
        return <Tag color="red">Admin</Tag>;

      case "shop_owner":
        return <Tag color="blue">Chủ cửa hàng</Tag>;

      default:
        return <Tag color="green">Người dùng</Tag>;
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredUsers = normalizedSearchTerm
    ? users.filter((user) =>
        [
          user.id,
          user.name,
          user.username,
          user.phone_number,
          user.address,
          user.role,
          user.role ? ROLE_LABELS[user.role] : "",
          user.shop?.id,
          user.shop?.name,
          user.shop?.address,
          user.shop?.description,
        ].some((value) => normalizeSearchText(value).includes(normalizedSearchTerm))
      )
    : users;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">👥 Quản lý người dùng</h2>

        <Button type="primary" onClick={handleAdd}>
          + Thêm người dùng
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input.Search
          allowClear
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm người dùng theo ID, tên, tài khoản, SĐT, địa chỉ, vai trò..."
          className="w-full md:max-w-xl"
        />
        <div className="text-sm font-semibold text-gray-500">
          Hiển thị {filteredUsers.length}/{users.length} người dùng
        </div>
      </div>

      <Table
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        bordered
        pagination={{
          pageSize: 8,
          showSizeChanger: true,
          pageSizeOptions: [8, 16, 32, 50],
          showTotal: (total) => `Tổng cộng ${total} người dùng`,
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
          },
          {
            title: "Tên",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Tài khoản",
            dataIndex: "username",
            key: "username",
          },
          {
            title: "SĐT",
            dataIndex: "phone_number",
            key: "phone_number",
          },
          {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address",
          },
          {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            render: (role) => renderRole(role),
          },
          {
            title: "Cửa hàng",
            key: "shop",
            render: (_, record: User) => record.shop?.name || "-",
          },
          {
            title: "Hành động",
            key: "actions",
            render: (_, record: User) => (
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
          <Form.Item
            label="Tên đầy đủ"
            name="name"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Tài khoản (Username)"
            name="username"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên tài khoản!",
              },
            ]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone_number"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              {
                max: 20,
                message: "Tối đa 20 ký tự.",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Dia chi"
            name="address"
            rules={[
              { required: true, message: "Vui lòng nhập địa chỉ!" },
              {
                max: 500,
                message: "Tối đa 500 ký tự.",
              },
            ]}
          >
            <AddressSelector />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: !editingUser,
                message: "Mật khẩu là bắt buộc khi tạo mới!",
              },
              {
                min: 6,
                message: "Mật khẩu phải có ít nhất 6 ký tự.",
              },
            ]}
            help={
              editingUser
                ? "Để trống nếu không muốn thay đổi mật khẩu."
                : null
            }
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn vai trò!",
              },
            ]}
          >
            <Select options={roleOptions} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
            {({ getFieldValue }) =>
              getFieldValue("role") === "shop_owner" ? (
                <>
                  <Form.Item
                    label="Tên cửa hàng"
                    name="shop_name"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên cửa hàng!",
                      },
                    ]}
                  >
                    <Input placeholder="VD: Fashion Store" />
                  </Form.Item>

                  <Form.Item label="Logo cửa hàng URL" name="shop_logo_url">
                    <Input placeholder="https://example.com/logo.png" />
                  </Form.Item>

                  <Form.Item label="Mô tả cửa hàng" name="shop_description">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item
                    label="Địa chỉ cửa hàng"
                    name="shop_address"
                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ cửa hàng!" }]}
                  >
                    <AddressSelector />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
