import type { Department } from '../types/file';

interface DepartmentQuotaCardProps {
  department: Department | null;
}

const formatBytes = (size?: number | null) => {
  if (size === null) {
    return 'Unlimited';
  }

  if (!size) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const usagePercent = (used?: number | null, limit?: number | null) => {
  if (!limit) return null;

  return Math.min(100, Math.round(((used ?? 0) / limit) * 100));
};

const progressTone = (percent: number | null) => {
  if (percent === null) return 'progress-neutral';
  if (percent >= 90) return 'progress-danger';
  if (percent >= 60) return 'progress-warning';

  return 'progress-success';
};

export function DepartmentQuotaCard({ department }: DepartmentQuotaCardProps) {
  const percent = department ? usagePercent(department.used_bytes, department.quota_bytes) : null;

  return (
    <section className="panel quota-card">
      <div className="panel-heading compact-heading">
        <div>
          <h2>Department Quota</h2>
          <p>{department ? department.name : 'Select a department'}</p>
        </div>
      </div>

      <div className="quota-list">
        <div>
          <span>Quota</span>
          <strong>{department ? formatBytes(department.quota_bytes ?? null) : '-'}</strong>
        </div>
        <div>
          <span>Used</span>
          <strong>{department ? formatBytes(department.used_bytes ?? 0) : '-'}</strong>
        </div>
        <div>
          <span>Available</span>
          <strong>{department ? formatBytes(department.available_bytes ?? null) : '-'}</strong>
        </div>
      </div>
      <div className="quota-progress">
        <div className="quota-progress-label">
          <span>Usage</span>
          <strong>{percent === null ? 'Unlimited' : `${percent}%`}</strong>
        </div>
        <div className="usage-bar">
          <span className={progressTone(percent)} style={{ width: `${percent ?? 0}%` }} />
        </div>
      </div>
    </section>
  );
}
