import { FormEvent, useEffect, useState } from 'react';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../services/departmentService';
import { ApiError } from '../services/apiClient';
import type { Department } from '../types/department';

const bytesFromUnit = (value: string, unit: 'bytes' | 'MB' | 'GB') => {
  if (value.trim() === '') return null;

  const amount = Number(value);

  if (Number.isNaN(amount)) return null;
  if (unit === 'GB') return Math.round(amount * 1024 * 1024 * 1024);
  if (unit === 'MB') return Math.round(amount * 1024 * 1024);

  return Math.round(amount);
};

const valueFromBytes = (value?: number | null) => (value == null ? '' : String(value));

const formatBytes = (size?: number | null) => {
  if (size === null) return 'Unlimited';
  if (!size) return '0 B';
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

const UsageProgress = ({ used, limit }: { used?: number | null; limit?: number | null }) => {
  const percent = usagePercent(used, limit);

  return (
    <div className="table-progress">
      <div className="usage-bar">
        <span className={progressTone(percent)} style={{ width: `${percent ?? 0}%` }} />
      </div>
      <small>{percent === null ? 'Unlimited' : `${percent}% used`}</small>
    </div>
  );
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [quotaBytes, setQuotaBytes] = useState('');
  const [quotaUnit, setQuotaUnit] = useState<'bytes' | 'MB' | 'GB'>('GB');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDepartments = async () => {
    setIsLoading(true);
    setError('');

    try {
      setDepartments(await getDepartments());
    } catch {
      setError('Could not load departments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setCode('');
    setQuotaBytes('');
    setQuotaUnit('GB');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        name,
        code: code.trim() || null,
        quota_bytes: bytesFromUnit(quotaBytes, quotaUnit),
      };

      if (editing) {
        await updateDepartment(editing.id, payload);
        setMessage('Department updated.');
      } else {
        await createDepartment(payload);
        setMessage('Department and Ceph bucket created successfully.');
      }

      resetForm();
      await loadDepartments();
    } catch {
      setError('Department save failed. Check required fields and unique code.');
    }
  };

  const handleEdit = (department: Department) => {
    setEditing(department);
    setName(department.name);
    setCode(department.code ?? '');
    setQuotaBytes(valueFromBytes(department.quota_bytes));
    setQuotaUnit('bytes');
  };

  const openDeleteModal = (department: Department) => {
    setDeleteTarget(department);
    setDeleteConfirmation('');
    setError('');
    setMessage('');
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      const response = await deleteDepartment(deleteTarget.id, true);
      setMessage(
        `${response.message} Deleted files: ${response.deleted_files ?? 0}. Deleted objects: ${response.deleted_objects ?? 0}. Bucket deleted: ${response.bucket_deleted ? 'Yes' : 'No'}.`,
      );
      closeDeleteModal();
      await loadDepartments();
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        const details = deleteError.details ?? {};
        const warningParts = [
          typeof details.files_count === 'number' ? `Files: ${details.files_count}` : null,
          typeof details.used_bytes === 'number' ? `Used: ${formatBytes(details.used_bytes)}` : null,
          typeof details.bucket_name === 'string' ? `Bucket: ${details.bucket_name}` : null,
        ].filter(Boolean);

        setError(warningParts.length > 0 ? `${deleteError.message} ${warningParts.join(' · ')}` : deleteError.message);
      } else {
        setError(deleteError instanceof Error ? deleteError.message : 'Department delete failed.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="panel admin-card">
      <div className="panel-heading">
        <div>
          <h2>Department Management</h2>
          <p>Create departments and manage storage quota.</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Code</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <label>
          <span>Quota</span>
          <input
            min="0"
            type="number"
            value={quotaBytes}
            placeholder="Blank = unlimited"
            onChange={(event) => setQuotaBytes(event.target.value)}
          />
        </label>
        <label>
          <span>Unit</span>
          <select value={quotaUnit} onChange={(event) => setQuotaUnit(event.target.value as 'bytes' | 'MB' | 'GB')}>
            <option value="GB">GB</option>
            <option value="MB">MB</option>
            <option value="bytes">Bytes</option>
          </select>
        </label>
        <div className="admin-form-actions">
          <button className="primary-button">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Quota</th>
              <th>Used</th>
              <th>Available</th>
              <th>Bucket Name</th>
              <th>Bucket Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9}>Loading departments...</td></tr>
            )}
            {!isLoading && departments.map((department) => (
              <tr key={department.id}>
                <td>{department.id}</td>
                <td>{department.name}</td>
                <td>{department.code ?? '-'}</td>
                <td>{formatBytes(department.quota_bytes ?? null)}</td>
                <td>
                  <div className="department-used-cell">
                    <strong>{formatBytes(department.used_bytes ?? 0)}</strong>
                    <UsageProgress used={department.used_bytes} limit={department.quota_bytes} />
                  </div>
                </td>
                <td>{formatBytes(department.available_bytes ?? null)}</td>
                <td>
                  {department.bucket_name ? (
                    <span className="path-cell">{department.bucket_name}</span>
                  ) : (
                    <span className="status badge-danger">Bucket missing</span>
                  )}
                </td>
                <td>{formatDate(department.bucket_created_at)}</td>
                <td>
                  <div className="action-buttons compact-actions">
                    <button className="info-button" type="button" onClick={() => handleEdit(department)}>Edit</button>
                    <button className="danger-button" type="button" onClick={() => openDeleteModal(department)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-department-title">
            <div className="modal-header">
              <div>
                <h2 id="delete-department-title">Delete Department and Ceph Data</h2>
                <p>{deleteTarget.name}</p>
              </div>
              <button className="secondary-button" type="button" disabled={isDeleting} onClick={closeDeleteModal}>
                Close
              </button>
            </div>

            <div className="alert warning">
              This will permanently delete department data from Ceph. This action cannot be undone.
            </div>

            <div className="delete-summary">
              <strong>This will delete:</strong>
              <ul>
                <li>Department record</li>
                <li>Department files</li>
                <li>Ceph objects in this department bucket</li>
                <li>File shares related to this department</li>
              </ul>
              <div className="metadata-panel inline-panel">
                <div>
                  <span>Bucket</span>
                  <strong>{deleteTarget.bucket_name ?? 'Bucket missing'}</strong>
                </div>
                <div>
                  <span>Used</span>
                  <strong>{formatBytes(deleteTarget.used_bytes ?? 0)}</strong>
                </div>
                <div>
                  <span>Available</span>
                  <strong>{formatBytes(deleteTarget.available_bytes ?? null)}</strong>
                </div>
              </div>
            </div>

            <label>
              <span>Type DELETE to confirm</span>
              <input
                value={deleteConfirmation}
                disabled={isDeleting}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button className="secondary-button" type="button" disabled={isDeleting} onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? 'Deleting...' : 'Delete Department and Ceph Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
