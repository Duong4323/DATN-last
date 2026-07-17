import React, { useEffect, useMemo, useState } from "react";
import { Input, Select, Spin } from "antd";
import {
  getCitiesByCountryAndState,
  getCountries,
  getStatesByCountry,
} from "@/api/addressApi";

interface AddressSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const toOptions = (items: string[]) =>
  items.map((item) => ({
    label: item,
    value: item,
  }));

const AddressSelector: React.FC<AddressSelectorProps> = ({
  value,
  onChange,
  placeholder = "So nha, ten duong...",
}) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [country, setCountry] = useState<string>();
  const [state, setState] = useState<string>();
  const [city, setCity] = useState<string>();
  const [detail, setDetail] = useState("");

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (value && !country && !state && !city && !detail) {
      setDetail(value);
    }
  }, [city, country, detail, state, value]);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);

      try {
        const data = await getCountries();
        setCountries(data);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const composedAddress = useMemo(
    () => [detail, city, state, country].map((item) => item?.trim()).filter(Boolean).join(", "),
    [city, country, detail, state]
  );

  useEffect(() => {
    onChange?.(composedAddress);
  }, [composedAddress, onChange]);

  const handleCountryChange = async (nextCountry: string) => {
    setCountry(nextCountry);
    setState(undefined);
    setCity(undefined);
    setStates([]);
    setCities([]);
    setLoadingStates(true);

    try {
      const data = await getStatesByCountry(nextCountry);
      setStates(data);
    } finally {
      setLoadingStates(false);
    }
  };

  const handleStateChange = async (nextState: string) => {
    if (!country) return;

    setState(nextState);
    setCity(undefined);
    setCities([]);
    setLoadingCities(true);

    try {
      const data = await getCitiesByCountryAndState(country, nextState);
      setCities(data);
    } finally {
      setLoadingCities(false);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        showSearch
        allowClear
        value={country}
        onChange={handleCountryChange}
        options={toOptions(countries)}
        placeholder="Chon dat nuoc"
        loading={loadingCountries}
        notFoundContent={loadingCountries ? <Spin size="small" /> : null}
        filterOption={(input, option) =>
          String(option?.label || "").toLowerCase().includes(input.toLowerCase())
        }
        className="w-full"
        size="large"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          showSearch
          allowClear
          disabled={!country}
          value={state}
          onChange={handleStateChange}
          options={toOptions(states)}
          placeholder="Chon tinh/bang"
          loading={loadingStates}
          notFoundContent={loadingStates ? <Spin size="small" /> : null}
          filterOption={(input, option) =>
            String(option?.label || "").toLowerCase().includes(input.toLowerCase())
          }
          size="large"
        />

        <Select
          showSearch
          allowClear
          disabled={!state}
          value={city}
          onChange={setCity}
          options={toOptions(cities)}
          placeholder="Chon thanh pho"
          loading={loadingCities}
          notFoundContent={loadingCities ? <Spin size="small" /> : null}
          filterOption={(input, option) =>
            String(option?.label || "").toLowerCase().includes(input.toLowerCase())
          }
          size="large"
        />
      </div>

      <Input.TextArea
        rows={2}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default AddressSelector;
