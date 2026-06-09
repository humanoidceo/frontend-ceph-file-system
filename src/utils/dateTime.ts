export const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Not scheduled';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
