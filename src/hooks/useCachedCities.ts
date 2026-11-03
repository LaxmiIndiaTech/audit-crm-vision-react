import { useEffect, useState } from 'react';
import { adminApi, AdminCity } from '@/lib/api';

let cachedCities: AdminCity[] | null = null;
let inflightPromise: Promise<AdminCity[]> | null = null;

export const fetchAllActiveCitiesOnce = async (): Promise<AdminCity[]> => {
  if (cachedCities) return cachedCities;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const res = await adminApi.getCities({ page: 1, per_page: 500 });
      const list = res.data.cities || [];
      cachedCities = list;
      return list;
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
};

export const useCachedCities = () => {
  const [cities, setCities] = useState<AdminCity[] | null>(cachedCities);
  const [loading, setLoading] = useState(!cachedCities);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedCities) {
      setCities(cachedCities);
      setLoading(false);
      return;
    }
    let mounted = true;
    fetchAllActiveCitiesOnce()
      .then((list) => {
        if (!mounted) return;
        setCities(list);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to load cities');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { cities: cities || [], loading, error };
};
