interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  helper?: string;
}

export function StatCard({ label, value, tone = 'primary', helper }: StatCardProps) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </div>
  );
}
