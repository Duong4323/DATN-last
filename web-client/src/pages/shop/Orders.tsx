import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Typography,
  Card,
  Space,
  Alert,
  Select,
  message,
  Badge,
  Button,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { getOrderHistory, updateOrder, OrderHistoryItem } from "../../api/orderApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const normalizeSearchText = (value: unknown) => String(value ?? "").toLowerCase();
const FINAL_ORDER_STATUSES = ["cancelled", "delivered"];

const STATUS_OPTIONS = [
  { key: "pending", label: "Chưa xử lý", color: "gold" },
  { key: "confirmed", label: "Đã xác nhận", color: "blue" },
  { key: "shipping", label: "Đang giao", color: "cyan" },
  { key: "delivered", label: "Đã giao", color: "green" },
  { key: "cancelled", label: "Đã hủy", color: "red" },
  { key: "returned", label: "Trả hàng", color: "purple" },
];

const PAYMENT_STATUS_OPTIONS = [
  { key: "unpaid", label: "Chưa thanh toán", color: "volcano" },
  { key: "paid", label: "Đã thanh toán", color: "green" },
  { key: "refunded", label: "Đã hoàn tiền", color: "geekblue" },
];

const ShopOwnerOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleStatusUpdate = async (
    orderId: number,
    field: "status" | "payment_status",
    value: string
  ) => {
    setUpdatingOrderId(orderId);

    try {
      await updateOrder(orderId, { [field]: value });
      message.success(`Cập nhật thành công đơn hàng #${orderId}`);
      fetchOrders();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredOrders = normalizedSearchTerm
    ? orders.filter((order: any) => {
        const statusLabel =
          STATUS_OPTIONS.find((option) => option.key === (order.statusKey || order.status))?.label ||
          order.orderStatus;
        const paymentLabel =
          PAYMENT_STATUS_OPTIONS.find(
            (option) => option.key === (order.paymentStatusKey || order.payment_status)
          )?.label || order.paymentStatus;
        const itemText = (order.items_info || [])
          .map((item: any) =>
            [
              item.product_id,
              item.product_name,
              item.color,
              item.size,
              item.quantity,
              item.price,
            ].join(" ")
          )
          .join(" ");

        return [
          order.id,
          order.orderId,
          order.buyerName,
          order.customer_name,
          order.customer_phone,
          order.shop_name,
          order.shipping_address,
          order.totalAmount,
          order.date,
          order.statusKey,
          order.status,
          statusLabel,
          order.paymentStatusKey,
          order.payment_status,
          paymentLabel,
          (order.products || []).join(" "),
          itemText,
        ].some((value) => normalizeSearchText(value).includes(normalizedSearchTerm));
      })
    : orders;

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
      title: "Chi tiết sản phẩm",
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
      key: "payment_status",
      width: 180,
      render: (value, record: any) => {
        const currentValue = value || record.payment_status;
        const currentOrderStatus = record.statusKey || record.status;
        const isFinalOrder = FINAL_ORDER_STATUSES.includes(currentOrderStatus);

        return (
          <Select
            value={currentValue}
            style={{ width: 160 }}
            loading={updatingOrderId === record.id}
            disabled={isFinalOrder}
            onChange={(val) =>
              handleStatusUpdate(record.id, "payment_status", val)
            }
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <Option key={opt.key} value={opt.key}>
                <Tag color={opt.color} style={{ margin: 0 }}>
                  {opt.label}
                </Tag>
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "statusKey",
      key: "order_status",
      width: 180,
      render: (value, record: any) => {
        const currentValue = value || record.status;
        const isFinalOrder = FINAL_ORDER_STATUSES.includes(currentValue);

        return (
          <Select
            value={currentValue}
            style={{ width: 160 }}
            loading={updatingOrderId === record.id}
            disabled={isFinalOrder}
            onChange={(val) => handleStatusUpdate(record.id, "status", val)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <Option key={opt.key} value={opt.key}>
                <Tag color={opt.color} style={{ margin: 0 }}>
                  {opt.label}
                </Tag>
              </Option>
            ))}
          </Select>
        );
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
              🏪 Đơn hàng của cửa hàng
            </Title>
            <Text type="secondary">
              Chủ cửa hàng cập nhật trạng thái vận chuyển và thanh toán.
            </Text>
          </div>

          <Button type="primary" onClick={fetchOrders} loading={loading}>
            Làm mới
          </Button>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-6" />}

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Search
            allowClear
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm đơn hàng theo mã, khách hàng, sản phẩm, trạng thái..."
            style={{ maxWidth: 520 }}
          />
          <Text type="secondary" strong>
            Hiển thị {filteredOrders.length}/{orders.length} đơn hàng
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
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

export default ShopOwnerOrderManagement;
