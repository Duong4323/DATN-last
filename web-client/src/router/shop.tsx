import { RouteObject, Navigate } from "react-router-dom";

import ShopLayout from "@/pages/shop/ShopLayout";

import ShopDashboard from "@/pages/shop/Dashboard";

import ShopProducts from "@/pages/shop/Products";

import ShopOwnerOrderManagement from "@/pages/shop/Orders";
import ShopProfilePage from "@/pages/shop/Profile";

import "../index.css";

const shopRoutes: RouteObject[] = [
  {
    path: "/shop",

    element: <ShopLayout />,

    children: [
      {
        index: true,

        element: <Navigate to="dashboard" replace />,
      },

      // Dashboard
      {
        path: "dashboard",

        element: <ShopDashboard />,
      },

      // Sản phẩm
      {
        path: "products",

        element: <ShopProducts />,
      },

      // Đơn hàng
      {
        path: "orders",

        element: <ShopOwnerOrderManagement />,
      },

      {
        path: "profile",

        element: <ShopProfilePage />,
      },
    ],
  },
];

export default shopRoutes;
