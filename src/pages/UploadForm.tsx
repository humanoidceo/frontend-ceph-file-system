import { FormEvent, useState } from 'react';
import { DepartmentSelect } from './DepartmentSelect';
import type { Department } from '../types/file';

interface UploadFormProps {
  onUpload: (file: File, departmentId: string) => Promise<void>;
  isUploading: boolean;
  departmentRefreshKey: number;
}

export function UploadForm({ onUpload, isUploading, departmentRefreshKey }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [department, setDepartment] = useState<Department | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    await onUpload(file, departmentId);
    setFile(null);
    event.currentTarget.reset();
  };

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

  return (
    <form className="panel upload-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <h2>Upload File</h2>
          <p>Send a file to the Laravel Ceph/S3 test API.</p>
        </div>
      </div>

      <div className="processing-note">
        Files are compressed and encrypted by the backend before storage.
      </div>

      <div className="form-grid">
        <label>
          <span>File</span>
          <input
            required
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <DepartmentSelect
          value={departmentId}
          onChange={setDepartmentId}
          onDepartmentChange={setDepartment}
          refreshKey={departmentRefreshKey}
          disabled={isUploading}
        />
      </div>

      <div className="upload-meta">
        <span>Selected file: {file ? formatBytes(file.size) : 'None'}</span>
        <span>Quota: {department ? formatBytes(department.quota_bytes ?? null) : 'Select department'}</span>
        <span>Used: {department ? formatBytes(department.used_bytes ?? 0) : 'Select department'}</span>
        <span>Available: {department ? formatBytes(department.available_bytes ?? null) : 'Select department'}</span>
      </div>

      <button className="primary-button" disabled={isUploading || !file || !departmentId}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
