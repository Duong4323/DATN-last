import React, { useEffect, useState } from "react";
import { Building2, Image, MapPin, Save, Store, Text } from "lucide-react";
import { message } from "antd";
import {
  getShopProfile,
  ShopProfilePayload,
  updateShopProfile,
} from "../../api/shopApi";

const initialForm: ShopProfilePayload = {
  name: "",
  logo_url: "",
  description: "",
  address: "",
};

const ShopProfilePage: React.FC = () => {
  const [formData, setFormData] = useState<ShopProfilePayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchShopProfile = async () => {
      setIsLoading(true);

      try {
        const shop = await getShopProfile();
        setFormData({
          name: shop.name || "",
          logo_url: shop.logo_url || "",
          description: shop.description || "",
          address: shop.address || "",
        });
      } catch (err: any) {
        message.error(err.response?.data?.message || "Không thể tải thông tin cửa hàng.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopProfile();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      message.warning("Vui lòng nhập tên cửa hàng.");
      return;
    }

    if (!formData.address?.trim()) {
      message.warning("Vui lòng nhập địa chỉ cửa hàng.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: ShopProfilePayload = {
        name: formData.name.trim(),
        logo_url: formData.logo_url?.trim() || null,
        description: formData.description?.trim() || null,
        address: formData.address?.trim() || null,
      };

      const response = await updateShopProfile(payload);
      setFormData({
        name: response.shop.name || "",
        logo_url: response.shop.logo_url || "",
        description: response.shop.description || "",
        address: response.shop.address || "",
      });
      message.success(response.message || "Đã cập nhật thông tin cửa hàng.");
    } catch (err: any) {
      message.error(err.response?.data?.message || "Cập nhật thông tin cửa hàng thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-10 text-center font-bold text-blue-600 shadow-sm">
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Thông tin cửa hàng</h1>
        <p className="text-sm text-gray-500">
          Cap nhat ten, logo, mo ta va dia chi hien thi cua shop.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Store size={16} />
                Tên cửa hàng
              </span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-gray-200 px-3 outline-none transition focus:border-blue-500"
                placeholder="Nhập tên cửa hàng"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Image size={16} />
                Logo URL
              </span>
              <input
                name="logo_url"
                value={formData.logo_url || ""}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-gray-200 px-3 outline-none transition focus:border-blue-500"
                placeholder="https://..."
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <MapPin size={16} />
                Dia chi
              </span>
              <input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border border-gray-200 px-3 outline-none transition focus:border-blue-500"
                placeholder="Nhập địa chỉ cửa hàng"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Text size={16} />
                Mô tả cửa hàng
              </span>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={6}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 outline-none transition focus:border-blue-500"
                placeholder="Giới thiệu ngắn về phong cách, sản phẩm và dịch vụ của shop"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Save size={16} />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-black text-gray-900">Xem truoc</h2>
              <p className="text-xs text-gray-500">Thong tin se hien thi cho khach hang.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-100">
            <div className="flex aspect-video items-center justify-center bg-gray-50">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt={formData.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Store className="text-gray-300" size={48} />
              )}
            </div>
            <div className="p-4">
              <h3 className="truncate text-lg font-black text-gray-900">
                {formData.name || "Tên cửa hàng"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {formData.address || "Chưa cập nhật địa chỉ"}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {formData.description || "Chưa có mô tả cửa hàng."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ShopProfilePage;
