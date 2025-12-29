import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, Card, Space, Alert, Select, Button, message, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
// 💡 Import API services - ĐÃ SỬA LỖI ĐƯỜNG DẪN
import { getOrderHistory, updateOrder } from '../../api/orderApi'; 

const { Title } = Typography;
const { Option } = Select;

// Định nghĩa kiểu dữ liệu cho một Đơn hàng
export interface OrderHistoryItem {
    id: number;
    orderId: string;
    buyerName: string;
    products: string[];
    totalAmount: number;
    date: string;
    orderStatus: string; // Trạng thái đã dịch (vd: 'Chưa xử lý')
    paymentStatus: string; 
    statusKey: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'; 
    // 💡 TRƯỜNG NÀY (paymentStatusKey) PHẢI ĐƯỢC API TRẢ VỀ
    paymentStatusKey: 'unpaid' | 'paid' | 'refunded'; 
}

// Định nghĩa các trạng thái đơn hàng
const STATUS_OPTIONS = [
    { key: 'pending', label: 'Chưa xử lý', color: 'gold' },
    { key: 'confirmed', label: 'Đã xác nhận', color: 'blue' },
    { key: 'shipping', label: 'Đang giao', color: 'cyan' },
    { key: 'delivered', label: 'Đã giao', color: 'green' },
    { key: 'cancelled', label: 'Đã hủy', color: 'red' },
];

// 💡 ĐỊNH NGHĨA TRẠNG THÁI THANH TOÁN MỚI
const PAYMENT_STATUS_OPTIONS = [
    { key: 'unpaid', label: 'Chưa thanh toán', color: 'volcano' },
    { key: 'paid', label: 'Đã thanh toán', color: 'green' },
    { key: 'refunded', label: 'Đã hoàn tiền', color: 'geekblue' },
];

const AdminOrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Giả định: Backend đã được sửa để trả về TẤT CẢ đơn hàng cho Admin
            const data = await getOrderHistory();
            setOrders(data);
        } catch (err: any) {
            console.error("Fetch Orders Error:", err);
            setError(err.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    // --- HÀM CHUNG XỬ LÝ CẬP NHẬT TRẠNG THÁI ---
    
    // Cập nhật trạng thái Đơn hàng (Order Status)
    const handleUpdateOrderStatus = async (orderId: number, newStatusKey: OrderHistoryItem['statusKey']) => {
        setUpdatingOrderId(orderId);
        try {
            // GỌI API: Chỉ gửi trường 'status'
            await updateOrder(orderId, { status: newStatusKey });

            message.success(`Trạng thái ĐH #${orderId} đã được cập nhật.`);
            fetchOrders(); 
        } catch (err: any) {
            console.error("Update Status Error:", err);
            message.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
        } finally {
            setUpdatingOrderId(null);
        }
    };
    
    // 💡 Cập nhật trạng thái Thanh toán (Payment Status)
    const handleUpdatePaymentStatus = async (orderId: number, newPaymentStatusKey: OrderHistoryItem['paymentStatusKey']) => {
        setUpdatingOrderId(orderId);
        try {
            // GỌI API: Chỉ gửi trường 'payment_status'
            await updateOrder(orderId, { payment_status: newPaymentStatusKey });

            message.success(`Trạng thái TT #${orderId} đã được cập nhật.`);
            fetchOrders(); 
        } catch (err: any) {
            console.error("Update Payment Status Error:", err);
            message.error(err.response?.data?.message || 'Cập nhật trạng thái thanh toán thất bại.');
        } finally {
            setUpdatingOrderId(null);
        }
    };
    
    // --- CẤU HÌNH CỘT BẢNG ---
    
    const getStatusOption = (key: string, options: typeof STATUS_OPTIONS | typeof PAYMENT_STATUS_OPTIONS) => options.find(o => o.key === key);

    const columns: ColumnsType<OrderHistoryItem> = [
        {
            title: 'Mã ĐH',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 100,
        },
        {
            title: 'Người mua',
            dataIndex: 'buyerName',
            key: 'buyerName',
            width: 150,
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
            width: 120,
            render: (amount: number) => (
                <span className="font-semibold text-red-600">
                    {amount.toLocaleString('vi-VN')} VND
                </span>
            ),
        },
        // -----------------------------------------------------------
        // 💡 CỘT TRẠNG THÁI THANH TOÁN (ĐÃ SỬA LỖI BẰNG CÁCH SỬ DỤNG paymentStatusKey)
        // -----------------------------------------------------------
        {
            title: 'Trạng thái TT',
            dataIndex: 'paymentStatus', 
            key: 'paymentStatus',
            width: 150,
            render: (_, record) => {
                const currentPaymentStatus = getStatusOption(record.paymentStatusKey, PAYMENT_STATUS_OPTIONS);
                
                return (
                    <Select
                        // SỬ DỤNG KEY GỐC TỪ API ĐỂ THIẾT LẬP GIÁ TRỊ MẶC ĐỊNH
                        defaultValue={record.paymentStatusKey} 
                        style={{ width: 140 }}
                        disabled={updatingOrderId === record.id} 
                        onChange={(newPaymentStatusKey: OrderHistoryItem['paymentStatusKey']) => 
                            handleUpdatePaymentStatus(record.id, newPaymentStatusKey)
                        }
                        dropdownRender={menu => (
                            <>
                                {menu}
                                <div style={{ padding: '4px 8px' }}>
                                    {updatingOrderId === record.id && <Skeleton.Input style={{ width: 120, height: 28 }} active size="small" />}
                                </div>
                            </>
                        )}
                    >
                        {PAYMENT_STATUS_OPTIONS.map(option => (
                            <Option key={option.key} value={option.key}>
                                <Tag color={option.color}>{option.label}</Tag>
                            </Option>
                        ))}
                    </Select>
                );
            },
        },
        // -----------------------------------------------------------
        // CỘT: TRẠNG THÁI ĐƠN HÀNG
        // -----------------------------------------------------------
        {
            title: 'Trạng thái ĐH',
            dataIndex: 'statusKey', // Dùng key gốc
            key: 'statusKey',
            width: 150,
            render: (_, record) => {
                const currentStatus = getStatusOption(record.statusKey, STATUS_OPTIONS);
                
                return (
                    <Select
                        defaultValue={record.statusKey}
                        style={{ width: 140 }}
                        disabled={updatingOrderId === record.id} 
                        onChange={(newStatusKey: OrderHistoryItem['statusKey']) => 
                            handleUpdateOrderStatus(record.id, newStatusKey)
                        }
                        dropdownRender={menu => (
                            <>
                                {menu}
                                <div style={{ padding: '4px 8px' }}>
                                    {updatingOrderId === record.id && <Skeleton.Input style={{ width: 120, height: 28 }} active size="small" />}
                                </div>
                            </>
                        )}
                    >
                        {STATUS_OPTIONS.map(option => (
                            <Option key={option.key} value={option.key}>
                                <Tag color={option.color}>{option.label}</Tag>
                            </Option>
                        ))}
                    </Select>
                );
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'date',
            key: 'date',
            width: 120,
        },
    ];

    if (loading) {
        return (
            <div className="p-4">
                <Card title={<Title level={3}>Quản lý Đơn hàng</Title>}>
                    <Skeleton active />
                </Card>
            </div>
        );
    }

    if (error) {
        return <Alert message="Lỗi tải dữ liệu" description={error} type="error" showIcon className="mt-4" />;
    }

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-100">
            <Card className="shadow-2xl">
                <Title level={2} className="text-indigo-600 mb-6 border-b pb-3">Quản lý Đơn hàng</Title>
                
                <Alert
                    message="Quyền Admin"
                    description="Bạn có quyền thay đổi trạng thái của bất kỳ đơn hàng nào bằng cách sử dụng thanh chọn."
                    type="warning"
                    showIcon
                    className="mb-6"
                />

                <Table 
                    columns={columns} 
                    dataSource={orders} 
                    pagination={{ pageSize: 15 }} 
                    rowKey="id"
                    scroll={{ x: 1200 }} 
                />
            </Card>
        </div>
    );
};

export default AdminOrderManagement;