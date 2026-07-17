import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Typography,
  Card,
  Space,
  Alert,
  Button,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { getOrderHistory, OrderHistoryItem } from "../../api/orderApi";

const { Title, Text } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chưa xử lý", color: "gold" },
  confirmed: { label: "Đã xác nhận", color: "blue" },
  shipping: { label: "Đang giao", color: "cyan" },
  delivered: { label: "Đã giao", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Trả hàng", color: "purple" },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "volcano" },
  paid: { label: "Đã thanh toán", color: "green" },
  refunded: { label: "Đã hoàn tiền", color: "geekblue" },
};

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getOrderHistory();
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: ColumnsType<OrderHistoryItem> = [
    {
      title: "Mã ĐH",
      dataIndex: "orderId",
      key: "orderId",
      width: 110,
      fixed: "left",
      render: (text) => (
        <Text copyable strong style={{ color: "#4f46e5" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Cửa hàng",
      dataIndex: "shop_name",
      key: "shop_name",
      width: 180,
      render: (text) => <Text strong>{text || "-"}</Text>,
    },
    {
      title: "Khách hàng",
      key: "buyer",
      width: 220,
      render: (_, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.buyerName || record.customer_name || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.shipping_address}
          </Text>
        </Space>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "products",
      key: "products",
      render: (products: string[]) => (
        <div>
          {(products || []).map((p, i) => (
            <div key={i} className="mb-1 flex gap-2">
              <Badge status="processing" />
              <Text style={{ fontSize: 12 }}>{p}</Text>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {Number(amount || 0).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatusKey",
      key: "paymentStatusKey",
      width: 150,
      render: (value: string, record: any) => {
        const key = value || record.payment_status;
        const item = PAYMENT_MAP[key] || { label: key, color: "default" };

        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "statusKey",
      key: "statusKey",
      width: 150,
      render: (value: string, record: any) => {
        const key = value || record.status;
        const item = STATUS_MAP[key] || { label: key, color: "default" };

        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "date",
      key: "date",
      width: 150,
    },
  ];

  return (
    <div className="p-6 md:p-8 bg-[#f5f7f9] min-h-screen">
      <Card bordered={false} className="rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
              📦 Quản lý đơn hàng hệ thống
            </Title>
            <Text type="secondary">
              Admin chỉ xem và giám sát đơn hàng của toàn bộ cửa hàng.
            </Text>
          </div>

          <Button type="primary" onClick={fetchOrders} loading={loading}>
            Làm mới
          </Button>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-6" />}

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default AdminOrderManagement;