import axios from "axios";

const TRY_ON_API_URL = `${import.meta.env.VITE_API_URL}/try-on`;

export interface TryOnResult {
  success: boolean;
  images: string[];
}

export const requestVirtualTryOn = async (data: {
  person_image_url: string;
  cloth_image_url: string;
  base_steps?: number;
  image_count?: number;
}): Promise<TryOnResult> => {
  const response = await axios.post<TryOnResult>(
    TRY_ON_API_URL,
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
