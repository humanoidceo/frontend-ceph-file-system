export const getUsagePercent = (
  used?: number | null,
  limit?: number | null,
): number | null => {
  if (!limit) return null;

  return Math.min(100, Math.round(((used ?? 0) / limit) * 100));
};

export const getQuotaStatusColor = (
  used?: number | null,
  limit?: number | null,
): 'success' | 'warning' | 'danger' | 'neutral' => {
  const percent = getUsagePercent(used, limit);

  if (percent === null) return 'neutral';
  if (percent >= 85) return 'danger';
  if (percent >= 60) return 'warning';

  return 'success';
};
