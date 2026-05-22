export const parsePage = (value: unknown, fallback = 1): number => {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
};

export const parseLimit = (
  value: unknown,
  fallback = 10,
  max = 100
): number => {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
};

export const paginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

export const sqlOffset = (page: number, limit: number): number =>
  (page - 1) * limit;
