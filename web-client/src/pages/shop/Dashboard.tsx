import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, PackageCheck, RefreshCw, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getShopOrderStatistics,
  ShopOrderStatistics,
} from "../../api/orderApi";

const emptyStats: ShopOrderStatistics = {
  revenue: 0,
  sold_products: 0,
  pending_orders: 0,
  completed_orders: 0,
  total_orders: 0,
  orders_by_month: [],
};

const formatCurrency = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatMonth = (value: string) => {
  const [year, month] = value.split("-");
  return month && year ? `${month}/${year}` : value;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<ShopOrderStatistics>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getShopOrderStatistics();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = useMemo(
    () =>
      stats.orders_by_month.map((item) => ({
        ...item,
        monthLabel: formatMonth(item.month),
      })),
    [stats.orders_by_month]
  );

  const metricCards = [
    {
      title: "Doanh thu",
      value: formatCurrency(stats.revenue),
      icon: Wallet,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Don hoan thanh",
      value: stats.completed_orders.toLocaleString("vi-VN"),
      icon: PackageCheck,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Sản phẩm đã bán",
      value: stats.sold_products.toLocaleString("vi-VN"),
      icon: PackageCheck,
      tone: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "Đơn chưa xử lý",
      value: stats.pending_orders.toLocaleString("vi-VN"),
      icon: AlertCircle,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      title: "Tổng đơn hàng",
      value: stats.total_orders.toLocaleString("vi-VN"),
      icon: ClipboardList,
      tone: "text-sky-600 bg-sky-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tổng quan cửa hàng</h1>
          <p className="text-sm text-gray-500">
            Theo dõi doanh thu, đơn hàng và số lượng sản phẩm đã bán.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">{card.title}</p>
                  <p className="mt-3 text-2xl font-black text-gray-900">{card.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.tone}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-gray-900">Doanh thu và đơn hàng theo tháng</h2>
            <p className="text-sm text-gray-500">
              Cột hiển thị số đơn đã giao và đã thanh toán, đường hiển thị doanh thu từ các đơn hoàn thành.
            </p>
          </div>

          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" />
                  <YAxis yAxisId="orders" allowDecimals={false} />
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "revenue"
                        ? [formatCurrency(Number(value)), "Doanh thu"]
                        : [Number(value).toLocaleString("vi-VN"), "Don hoan thanh"]
                    }
                  />
                  <Legend />
                  <Bar yAxisId="orders" dataKey="completed_orders" name="Don hoan thanh" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#059669" strokeWidth={3} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm font-semibold text-gray-400">
                Chưa có dữ liệu đơn hàng theo tháng.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Bảng tổng hợp</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">Tháng</th>
                  <th className="px-3 py-3">Hoàn thành</th>
                  <th className="px-3 py-3">Đã bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData.length > 0 ? (
                  chartData.map((item) => (
                    <tr key={item.month} className="text-gray-700">
                      <td className="px-3 py-3 font-bold">{item.monthLabel}</td>
                      <td className="px-3 py-3">{item.completed_orders}</td>
                      <td className="px-3 py-3">{item.sold_products}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
