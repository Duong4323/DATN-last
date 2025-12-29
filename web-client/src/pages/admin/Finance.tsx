import React from "react";

const Finance: React.FC = () => {
  const data = [
    { month: "Tháng 1", income: 50000000, expense: 20000000 },
    { month: "Tháng 2", income: 60000000, expense: 30000000 },
    { month: "Tháng 3", income: 55000000, expense: 25000000 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Thống kê thu chi</h1>
      <table className="w-full bg-white rounded-lg shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Tháng</th>
            <th className="py-2 px-4 text-left">Thu nhập</th>
            <th className="py-2 px-4 text-left">Chi tiêu</th>
            <th className="py-2 px-4 text-left">Lợi nhuận</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month} className="border-t">
              <td className="py-2 px-4">{d.month}</td>
              <td className="py-2 px-4 text-green-600">
                {d.income.toLocaleString()} ₫
              </td>
              <td className="py-2 px-4 text-red-500">
                {d.expense.toLocaleString()} ₫
              </td>
              <td className="py-2 px-4 font-semibold text-gray-700">
                {(d.income - d.expense).toLocaleString()} ₫
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Finance;
