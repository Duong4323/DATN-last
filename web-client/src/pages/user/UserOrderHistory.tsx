// components/UserOrderHistory.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, Card, Space, Button, message, Skeleton, Alert, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
// 💡 Import API services từ file đã tạo
import { getOrderHistory, cancelOrder, OrderHistoryItem } from '../../api/orderApi'; 

const { Title } = Typography;

// Định nghĩa các trạng thái đơn hàng (để biết khi nào nút Hủy được hiển thị)
const CANCELLABLE_STATUSES = ['pending', 'confirmed']; 

// Hàm lấy màu Tag cho Trạng thái Đơn hàng
const getOrderStatusTag = (status: string) => {
    let color: string;
    switch (status) {
        case 'Đã giao':
            color = 'green';
            break;
        case 'Đang giao':
            color = 'blue';
            break;
        case 'Chưa xử lý':
            color = 'gold';
            break;
        case 'Đã xác nhận':
            color = 'geekblue';
            break;
        case 'Đã hủy':
            color = 'red';
            break;
        default:
            color = 'default';
    }
    return <Tag color={color}>{status}</Tag>;
};

// Hàm lấy màu Tag cho Trạng thái Thanh toán
const getPaymentStatusTag = (status: string) => {
    let color: string;
    switch (status) {
        case 'Đã thanh toán':
            color = 'cyan';
            break;
        case 'Chưa thanh toán':
            color = 'volcano';
            break;
        default:
            color = 'default';
    }
    return <Tag color={color}>{status}</Tag>;
};


const UserOrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    /**
     * Tải lịch sử đơn hàng từ API
     */
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // 🎯 Gọi API
            const data: OrderHistoryItem[] = await getOrderHistory();
            setOrders(data);
        } catch (err: any) {
            console.error("Fetch Orders Error:", err);
            setError(err.response?.data?.message || 'Không thể tải lịch sử đơn hàng. Vui lòng kiểm tra đăng nhập.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    /**
     * Xử lý Hủy đơn hàng
     */
    const handleCancelOrder = async (orderId: number) => {
        setCancellingId(orderId);
        try {
            // 🎯 Gọi API Hủy đơn hàng
            const response = await cancelOrder(orderId);
            message.success(response.message);
            
            // Tải lại dữ liệu sau khi hủy thành công
            fetchOrders(); 
        } catch (err: any) {
            console.error("Cancel Order Error:", err);
            const msg = err.response?.data?.message || 'Không thể hủy đơn hàng.';
            message.error(msg);
        } finally {
            setCancellingId(null);
        }
    };

    // Định nghĩa các cột của bảng
    const columns: ColumnsType<OrderHistoryItem> = [
        {
            title: 'Mã ĐH',
            dataIndex: 'orderId',
            key: 'orderId',
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'products',
            key: 'products',
            render: (products: string[]) => (
                <Space direction="vertical" size={2}>
                    {products.map((product, index) => (
                        <div key={index} className="text-sm text-gray-600 truncate max-w-xs">{product}</div>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Thành tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            sorter: (a, b) => a.totalAmount - b.totalAmount,
            render: (amount: number) => (
                <span className="font-semibold text-red-600">
                    {amount.toLocaleString('vi-VN')} VND
                </span>
            ),
        },
        {
            title: 'Trạng thái Đơn hàng',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            render: getOrderStatusTag,
        },
        {
            title: 'Trạng thái Thanh toán',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: getPaymentStatusTag,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {/* Kiểm tra trạng thái có thể hủy: 'pending' hoặc 'confirmed' */}
                    {CANCELLABLE_STATUSES.includes(record.statusKey) && (
                        <Popconfirm
                            title="Xác nhận hủy đơn hàng"
                            description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
                            onConfirm={() => handleCancelOrder(record.id)}
                            okText="Đồng ý"
                            cancelText="Không"
                            disabled={cancellingId === record.id}
                        >
                            <Button 
                                danger 
                                size="small"
                                loading={cancellingId === record.id}
                            >
                                Hủy
                            </Button>
                        </Popconfirm>
                    )}
                    {/* Các nút hành động khác (ví dụ: Xem chi tiết) có thể thêm ở đây */}
                </Space>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="p-4 md:p-8 min-h-screen">
                <Card title={<Title level={3}>Lịch Sử Đơn Hàng</Title>}>
                    <Skeleton active />
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Alert message="Lỗi" description={error} type="error" showIcon />
            </div>
        );
    }
    
    if (orders.length === 0) {
        return (
            <div className="p-4 md:p-8">
                <Alert 
                    message="Không có đơn hàng nào" 
                    description="Bạn chưa thực hiện đơn hàng nào." 
                    type="warning" 
                    showIcon 
                />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-100">
            <Card className="shadow-2xl">
                <Title level={2} className="text-indigo-600 mb-6 border-b pb-3">Lịch Sử Đơn Hàng Của Bạn</Title>

                <Table 
                    columns={columns} 
                    dataSource={orders} 
                    pagination={{ pageSize: 10 }}
                    rowKey="id"
                    scroll={{ x: 900 }} 
                />
            </Card>
        </div>
    );
};

export default UserOrderHistory;