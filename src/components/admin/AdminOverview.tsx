import { useEffect, useState } from 'react';
import { getUsers } from '../../services/adminUserService';
import { getDepartments } from '../../services/departmentService';
import type { FileItem } from '../../types/file';
import { formatBytes } from '../../utils/formatBytes';
import { SectionHeader } from '../layout/SectionHeader';
import { StatCard } from '../layout/StatCard';

interface AdminOverviewProps {
  files: FileItem[];
}

export function AdminOverview({ files }: AdminOverviewProps) {
  const [departmentCount, setDepartmentCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setError('');

      try {
        const [departments, users] = await Promise.all([getDepartments(), getUsers()]);
        setDepartmentCount(departments.length);
        setUserCount(users.length);
      } catch {
        setError('Overview counts could not be loaded.');
      }
    };

    void loadStats();
  }, []);

  const storageUsed = files.reduce((total, file) => total + (file.size ?? 0), 0);

  return (
    <section className="module-stack">
      <SectionHeader
        title="Admin Dashboard"
        subtitle="System-wide overview for departments, users, files, and storage usage."
      />
      {error && <div className="alert alert-warning">{error}</div>}
      <div className="stat-grid">
        {departmentCount !== null && <StatCard label="Departments" value={departmentCount} tone="success" />}
        {userCount !== null && <StatCard label="Users" value={userCount} tone="purple" />}
        <StatCard label="Files" value={files.length} tone="info" />
        <StatCard label="Storage Used" value={formatBytes(storageUsed)} tone="primary" />
      </div>
    </section>
  );
}
