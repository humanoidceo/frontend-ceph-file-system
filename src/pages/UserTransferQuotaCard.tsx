import type { CurrentUser } from '../types/auth';

interface UserTransferQuotaCardProps {
  user: CurrentUser;
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

export function UserTransferQuotaCard({ user }: UserTransferQuotaCardProps) {
  const uploadPercent = usagePercent(user.daily_upload_used_bytes, user.daily_upload_limit_bytes);
  const downloadPercent = usagePercent(user.daily_download_used_bytes, user.daily_download_limit_bytes);

  return (
    <section className="panel quota-card">
      <div className="panel-heading compact-heading">
        <div>
          <h2>My Limits / Usage</h2>
          <p>24-hour user upload/download allowance</p>
        </div>
      </div>

      <div className="quota-list">
        <div>
          <span>Max upload chunk</span>
          <strong>{formatBytes(user.max_upload_chunk_bytes)}</strong>
        </div>
        <div>
          <span>Max download chunk</span>
          <strong>{formatBytes(user.max_download_chunk_bytes)}</strong>
        </div>
        <div>
          <span>Daily upload limit</span>
          <strong>{formatBytes(user.daily_upload_limit_bytes)}</strong>
        </div>
        <div>
          <span>Upload used</span>
          <strong>{formatBytes(user.daily_upload_used_bytes)}</strong>
        </div>
        <div>
          <span>Upload available</span>
          <strong>{formatBytes(user.daily_upload_available_bytes)}</strong>
        </div>
        <div>
          <span>Daily download limit</span>
          <strong>{formatBytes(user.daily_download_limit_bytes)}</strong>
        </div>
        <div>
          <span>Download used</span>
          <strong>{formatBytes(user.daily_download_used_bytes)}</strong>
        </div>
        <div>
          <span>Download available</span>
          <strong>{formatBytes(user.daily_download_available_bytes)}</strong>
        </div>
        <div>
          <span>Reset at</span>
          <strong>
            {user.daily_quota_reset_at
              ? new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(user.daily_quota_reset_at))
              : 'Not scheduled'}
          </strong>
        </div>
      </div>
      <div className="quota-progress-grid">
        <div className="quota-progress">
          <div className="quota-progress-label">
            <span>Daily upload usage</span>
            <strong>{uploadPercent === null ? 'Unlimited' : `${uploadPercent}%`}</strong>
          </div>
          <div className="usage-bar">
            <span className={progressTone(uploadPercent)} style={{ width: `${uploadPercent ?? 0}%` }} />
          </div>
        </div>
        <div className="quota-progress">
          <div className="quota-progress-label">
            <span>Daily download usage</span>
            <strong>{downloadPercent === null ? 'Unlimited' : `${downloadPercent}%`}</strong>
          </div>
          <div className="usage-bar">
            <span className={progressTone(downloadPercent)} style={{ width: `${downloadPercent ?? 0}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
