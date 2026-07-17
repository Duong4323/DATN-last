import axios from "axios";

const ADDRESS_API_URL = "https://countriesnow.space/api/v0.1";

interface CountriesResponse {
  data: Array<{
    country: string;
    cities?: string[];
  }>;
}

interface StatesResponse {
  data: {
    states: Array<{
      name: string;
    }>;
  };
}

interface CitiesResponse {
  data: string[];
}

export const getCountries = async (): Promise<string[]> => {
  const response = await axios.get<CountriesResponse>(`${ADDRESS_API_URL}/countries`);

  return response.data.data
    .map((item) => item.country)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

export const getStatesByCountry = async (country: string): Promise<string[]> => {
  const response = await axios.post<StatesResponse>(`${ADDRESS_API_URL}/countries/states`, {
    country,
  });

  return (response.data.data?.states || [])
    .map((item) => item.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

export const getCitiesByCountryAndState = async (
  country: string,
  state: string
): Promise<string[]> => {
  const response = await axios.post<CitiesResponse>(
    `${ADDRESS_API_URL}/countries/state/cities`,
    {
      country,
      state,
    }
  );

  return (response.data.data || []).filter(Boolean).sort((a, b) => a.localeCompare(b));
};
