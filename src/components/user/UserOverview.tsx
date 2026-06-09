import type { CurrentUser } from '../../types/auth';
import type { Department, FileItem } from '../../types/file';
import { formatDateTime } from '../../utils/dateTime';
import { formatBytes } from '../../utils/formatBytes';
import { SectionHeader } from '../layout/SectionHeader';
import { StatCard } from '../layout/StatCard';
import { DepartmentQuotaCard } from '../../pages/DepartmentQuotaCard';
import { UserTransferQuotaCard } from '../../pages/UserTransferQuotaCard';

interface UserOverviewProps {
  user: CurrentUser;
  department: Department | null;
  files: FileItem[];
}

export function UserOverview({ user, department, files }: UserOverviewProps) {
  const sharedFiles = files.filter((file) => file.source === 'Shared With Us');

  return (
    <section className="module-stack">
      <SectionHeader
        title="Department Dashboard"
        subtitle="Your department storage, transfer limits, and shared file overview."
      />
      <div className="stat-grid">
        <StatCard label="Department" value={department?.name ?? 'No department'} tone="primary" />
        <StatCard label="My Files" value={files.length - sharedFiles.length} tone="success" />
        <StatCard label="Shared With Us" value={sharedFiles.length} tone="purple" />
        <StatCard
          label="Quota Resets"
          value={formatDateTime(user.daily_quota_reset_at)}
          tone="warning"
        />
        <StatCard
          label="Upload Available"
          value={formatBytes(user.daily_upload_available_bytes)}
          tone="info"
        />
        <StatCard
          label="Download Available"
          value={formatBytes(user.daily_download_available_bytes)}
          tone="success"
        />
      </div>
      <div className="quota-grid">
        <UserTransferQuotaCard user={user} />
        <DepartmentQuotaCard department={department} />
      </div>
    </section>
  );
}
