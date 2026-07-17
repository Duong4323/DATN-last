import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, Card, Space, Button, message, Skeleton, Alert, Popconfirm, Modal, Rate, Input, Upload, Select } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, StarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
// Import các hàm API và Interface chuẩn
import { getOrderHistory, cancelOrder, returnOrder, submitReview, OrderHistoryItem } from '../../api/orderApi'; 

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Cấu hình các điều kiện hiển thị nút dựa trên statusKey từ Backend
const CANCELLABLE_STATUSES = ['pending', 'confirmed']; 
const REVIEWABLE_STATUSES = ['delivered']; 

const UserOrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    // --- State cho Modal Đánh giá ---
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
    
    // 💡 SỬA LỖI: State lưu ID sản phẩm thực tế được chọn từ danh sách items_info
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data: OrderHistoryItem[] = await getOrderHistory();
            setOrders(data);
        } catch (err: any) {
            console.error("Fetch Orders Error:", err);
            setError(err.response?.data?.message || 'Không thể tải lịch sử đơn hàng.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    // --- Xử lý Hủy đơn hàng ---
    const handleCancelOrder = async (orderId: number) => {
        setCancellingId(orderId);
        try {
            const response = await cancelOrder(orderId);
            message.success(response.message);
            fetchOrders(); 
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Không thể hủy đơn hàng.');
        } finally {
            setCancellingId(null);
        }
    };

    // --- Xử lý Trả hàng ---
    const handleReturnOrder = async (orderId: number) => {
        try {
            await returnOrder(orderId);
            message.success("Yêu cầu trả hàng đã được gửi thành công.");
            fetchOrders();
        } catch (err: any) {
            message.error(err.response?.data?.message || "Không thể gửi yêu cầu trả hàng.");
        }
    };

    // --- Xử lý Mở Modal Đánh giá ---
    const openReviewModal = (order: OrderHistoryItem) => {
        setSelectedOrder(order);
        setReviewData({ rating: 5, comment: '' });
        setFileList([]);
        
        // 💡 SỬA LỖI: Tự động chọn sản phẩm đầu tiên từ items_info nếu có dữ liệu
        if (order.items_info && order.items_info.length > 0) {
            setSelectedProductId(order.items_info[0].product_id);
        } else {
            setSelectedProductId(null);
        }
        
        setIsReviewModalOpen(true);
    };

    // --- Xử lý Gửi Đánh giá ---
    const handleReviewSubmit = async () => {
        if (!selectedOrder || !selectedProductId) {
            message.warning("Vui lòng chọn sản phẩm bạn muốn đánh giá.");
            return;
        }
        
        setSubmittingReview(true);
        const formData = new FormData();
        formData.append('order_id', selectedOrder.id.toString());
        
        // 💡 SỬA LỖI: Truyền ID sản phẩm thực tế thay vì giá trị cứng "1"
        formData.append('product_id', selectedProductId.toString()); 
        
        formData.append('rating', reviewData.rating.toString());
        formData.append('comment', reviewData.comment);
        
        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append('image', fileList[0].originFileObj);
        }

        try {
            await submitReview(formData);
            message.success("Cảm ơn bạn đã đánh giá sản phẩm!");
            setIsReviewModalOpen(false);
            fetchOrders();
        } catch (err: any) {
            message.error(err.response?.data?.message || "Gửi đánh giá thất bại.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const columns: ColumnsType<OrderHistoryItem> = [
        { 
            title: 'Mã Đơn Hàng', 
            dataIndex: 'orderId', 
            key: 'orderId', 
            width: 150,
            render: (text) => <Text strong className="text-indigo-600">{text}</Text>
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'products',
            key: 'products',
            render: (products: string[]) => (
                <Space direction="vertical" size={2}>
                    {products.map((product, index) => (
                        <Tag key={index} color="blue" className="text-xs truncate max-w-[250px] border-none bg-blue-50 text-blue-600">
                            {product}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Thành tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => <span className="font-black text-red-600">{amount.toLocaleString('vi-VN')} ₫</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            render: (status: string) => {
                let color = 'default';
                if (status === 'Đã giao') color = 'green';
                if (status === 'Trả hàng/Hoàn tiền') color = 'volcano';
                if (status === 'Đang giao') color = 'blue';
                if (status === 'Chưa xử lý') color = 'orange';
                return <Tag color={color} className="font-bold uppercase text-[10px] px-3 rounded-full">{status}</Tag>;
            },
        },
        { 
            title: 'Ngày tạo', 
            dataIndex: 'date', 
            key: 'date',
            render: (date) => <Text type="secondary" className="text-xs">{date}</Text>
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    {CANCELLABLE_STATUSES.includes(record.statusKey) && (
                        <Popconfirm title="Xác nhận hủy đơn hàng?" onConfirm={() => handleCancelOrder(record.id)} okText="Đồng ý" cancelText="Quay lại">
                            <Button danger size="small" type="primary" loading={cancellingId === record.id} className="rounded-lg font-bold">Hủy đơn</Button>
                        </Popconfirm>
                    )}

                    {REVIEWABLE_STATUSES.includes(record.statusKey) && (
                        <>
                            <Button 
                                type="primary" 
                                size="small" 
                                icon={<StarOutlined />}
                                onClick={() => openReviewModal(record)}
                                className="rounded-lg font-bold bg-indigo-600 border-none shadow-indigo-100 shadow-md"
                            >
                                Đánh giá
                            </Button>
                            <Popconfirm 
                                title="Xác nhận yêu cầu trả hàng?" 
                                description="Yêu cầu sẽ được chuyển đến Admin duyệt."
                                onConfirm={() => handleReturnOrder(record.id)}
                            >
                                <Button size="small" className="rounded-lg font-bold border-gray-300">Trả hàng</Button>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    if (loading && orders.length === 0) return <div className="p-20 text-center"><Skeleton active paragraph={{ rows: 10 }} /></div>;

    return (
        <div className="p-4 md:p-10 min-h-screen bg-[#f8fafc]">
            <Card className="shadow-2xl border-none rounded-[32px] overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <ShoppingCartOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Lịch Sử Đơn Hàng</Title>
                        <Text type="secondary">Quản lý và theo dõi trạng thái các đơn hàng của bạn</Text>
                    </div>
                </div>

                {error && <Alert message="Thông báo" description={error} type="error" showIcon className="mb-6 rounded-2xl" />}

                <Table 
                    columns={columns} 
                    dataSource={orders} 
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    scroll={{ x: 900 }} 
                    className="custom-table"
                />
            </Card>

            {/* MODAL ĐÁNH GIÁ SẢN PHẨM */}
            <Modal
                title={<span className="font-black text-xl uppercase italic flex items-center gap-2"><StarOutlined className="text-yellow-400"/> Đánh giá sản phẩm</span>}
                open={isReviewModalOpen}
                onOk={handleReviewSubmit}
                confirmLoading={submittingReview}
                onCancel={() => setIsReviewModalOpen(false)}
                okText="Gửi đánh giá ngay"
                cancelText="Đóng"
                centered
                width={500}
                className="review-modal"
            >
                <Space direction="vertical" className="w-full py-4" size="large">
                    {/* 💡 SỬA LỖI: Cho phép người dùng chọn chính xác sản phẩm trong đơn hàng */}
                    <div>
                        <Text strong className="text-gray-700 block mb-2">Sản phẩm bạn muốn đánh giá:</Text>
                        <Select 
                            placeholder="Vui lòng chọn sản phẩm" 
                            className="w-full"
                            size="large"
                            value={selectedProductId}
                            onChange={(val) => setSelectedProductId(val)}
                            dropdownStyle={{ borderRadius: '12px' }}
                        >
                            {selectedOrder?.items_info?.map((item) => (
                                <Option key={item.product_id} value={item.product_id}>
                                    <Text strong>{item.product_name}</Text> {item.size && <Tag className="ml-2">Size: {item.size}</Tag>}
                                </Option>
                            ))}
                        </Select>
                        <Alert 
                            message="Bạn có thể đánh giá từng sản phẩm có trong đơn hàng này." 
                            type="info" showIcon className="mt-3 py-1 text-[11px] border-none bg-indigo-50 text-indigo-600 rounded-xl" 
                        />
                    </div>

                    <div>
                        <Text strong className="text-gray-700 block mb-2">Mức độ hài lòng:</Text>
                        <Rate 
                            style={{ fontSize: '32px' }} 
                            value={reviewData.rating} 
                            onChange={(val) => setReviewData({...reviewData, rating: val})} 
                        />
                        <Text className="ml-4 font-bold text-yellow-500 italic">
                            {reviewData.rating === 5 ? 'Tuyệt vời!' : reviewData.rating >= 4 ? 'Tốt' : reviewData.rating >= 3 ? 'Bình thường' : 'Kém'}
                        </Text>
                    </div>

                    <div>
                        <Text strong className="text-gray-700 block mb-2">Chia sẻ cảm nhận của bạn:</Text>
                        <TextArea 
                            rows={4} 
                            placeholder="Chất vải như thế nào? Form dáng có chuẩn không?..." 
                            value={reviewData.comment}
                            onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                            className="rounded-2xl bg-gray-50 border-none focus:bg-white transition-all p-4"
                        />
                    </div>

                    <div>
                        <Text strong className="text-gray-700 block mb-2">Hình ảnh thực tế (không bắt buộc):</Text>
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                            maxCount={1}
                            className="review-upload"
                        >
                            {fileList.length < 1 && (
                                <div className="text-gray-400">
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }} className="font-bold text-[10px] uppercase">Tải ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </div>
                </Space>
            </Modal>
        </div>
    );
};

export default UserOrderHistory;