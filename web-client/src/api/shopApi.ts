import axios from "axios";

const SHOP_PROFILE_URL = `${import.meta.env.VITE_API_URL}/shop/profile`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export interface ShopProfile {
  id: number;
  user_id: number;
  name: string;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopProfilePayload {
  name: string;
  logo_url?: string | null;
  description?: string | null;
  address?: string | null;
}

export const getShopProfile = async (): Promise<ShopProfile> => {
  const response = await axios.get<ShopProfile>(SHOP_PROFILE_URL, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateShopProfile = async (
  payload: ShopProfilePayload
): Promise<{ message: string; shop: ShopProfile }> => {
  const response = await axios.put<{ message: string; shop: ShopProfile }>(
    SHOP_PROFILE_URL,
    payload,
    {
      headers: authHeaders(),
    }
  );

  return response.data;
};
