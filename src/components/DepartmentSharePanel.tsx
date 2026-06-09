import { FormEvent, useEffect, useState } from 'react';
import { getDepartments } from '../services/departmentService';
import { ApiError, getDepartmentShares } from '../services/fileService';
import type {
  ApiValidationErrors,
  Department,
  DepartmentFileShare,
  DepartmentSharePayload,
  FileItem,
} from '../types/file';
import type { CurrentUser } from '../types/auth';

interface DepartmentSharePanelProps {
  file: FileItem;
  user: CurrentUser;
  isBusy: boolean;
  onCreate: (id: number, payload: DepartmentSharePayload) => Promise<void>;
  onRemove: (id: number, shareId: number) => Promise<void>;
}

const flattenValidationErrors = (errors?: ApiValidationErrors) => {
  if (!errors) return [];

  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );
};

const formatError = (error: unknown) => {
  if (error instanceof ApiError) {
    const validationMessages = flattenValidationErrors(error.errors);

    return validationMessages.length > 0
      ? `${error.message}: ${validationMessages.join(' ')}`
      : error.message;
  }

  return 'Something went wrong. Please try again.';
};

const departmentLabel = (department?: Department | null) => {
  if (!department) return 'Unknown department';

  return department.code ? `${department.name} (${department.code})` : department.name;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'No expiry';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const toApiDateTime = (value: string) => {
  if (!value) return null;

  return value.replace('T', ' ');
};

const shareExpiryStatus = (expiresAt?: string | null) => {
  if (!expiresAt) return 'No expiry';

  return new Date(expiresAt).getTime() > Date.now() ? 'Active' : 'Expired';
};

export function DepartmentSharePanel({
  file,
  user,
  isBusy,
  onCreate,
  onRemove,
}: DepartmentSharePanelProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shares, setShares] = useState<DepartmentFileShare[]>([]);
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [nextDepartments, nextShares] = await Promise.all([
        getDepartments(),
        getDepartmentShares(file.id),
      ]);

      setDepartments(nextDepartments);
      setShares(nextShares);
    } catch (loadError) {
      setError(formatError(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [file.id]);

  const availableDepartments = departments.filter((department) => department.id !== file.department?.id);
  const canManageShares = user.role === 'admin' || file.source !== 'Shared With Us';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!toDepartmentId) {
      setError('Select a target department.');
      return;
    }

    try {
      await onCreate(file.id, {
        to_department_id: Number(toDepartmentId),
        can_view: canView,
        can_download: canDownload,
        expires_at: toApiDateTime(expiresAt),
      });

      setMessage('Department share saved.');
      setToDepartmentId('');
      setCanView(true);
      setCanDownload(false);
      setExpiresAt('');
      await loadData();
    } catch (shareError) {
      setError(formatError(shareError));
    }
  };

  const handleRemove = async (share: DepartmentFileShare) => {
    setMessage('');
    setError('');

    try {
      await onRemove(file.id, share.id);
      setMessage('Department share removed.');
      await loadData();
    } catch (removeError) {
      setError(formatError(removeError));
    }
  };

  if (!canManageShares) {
    return (
      <div className="inline-panel share-panel">
        <p className="muted-text">Shared files can be viewed here, but only the source department or an admin can manage shares.</p>
      </div>
    );
  }

  return (
    <div className="inline-panel share-panel">
      <form className="share-panel-form" onSubmit={handleSubmit}>
        <label>
          <span>Target department</span>
          <select
            required
            value={toDepartmentId}
            disabled={isBusy || isLoading}
            onChange={(event) => setToDepartmentId(event.target.value)}
          >
            <option value="">Select department</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {departmentLabel(department)}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={canView}
            disabled={isBusy}
            onChange={(event) => {
              setCanView(event.target.checked);

              if (!event.target.checked) {
                setCanDownload(false);
              }
            }}
          />
          <span>Can view</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={canDownload}
            disabled={isBusy || !canView}
            onChange={(event) => setCanDownload(event.target.checked)}
          />
          <span>Can download</span>
        </label>

        <label>
          <span>Expires at</span>
          <input
            type="datetime-local"
            value={expiresAt}
            disabled={isBusy}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>

        <button className="primary-button" disabled={isBusy || isLoading}>
          Save Share
        </button>
      </form>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="share-list">
        <h3>Existing Shares</h3>
        {isLoading && <p className="muted-text">Loading shares...</p>}
        {!isLoading && shares.length === 0 && <p className="muted-text">No department shares yet.</p>}
        {!isLoading && shares.map((share) => (
          <div className="share-row" key={share.id}>
            <div>
              <strong>{departmentLabel(share.to_department)}</strong>
              <div className="share-badges">
                <span className={`status ${share.can_view ? 'badge-success' : 'badge-neutral'}`}>
                  View {share.can_view ? 'Yes' : 'No'}
                </span>
                <span className={`status ${share.can_download ? 'badge-success' : 'badge-neutral'}`}>
                  Download {share.can_download ? 'Yes' : 'No'}
                </span>
                <span className={`status ${shareExpiryStatus(share.expires_at) === 'Expired' ? 'badge-danger' : 'badge-info'}`}>
                  {shareExpiryStatus(share.expires_at)}
                </span>
              </div>
              <span>Expires: {formatDate(share.expires_at)}</span>
            </div>
            <button
              className="danger-button"
              type="button"
              disabled={isBusy}
              onClick={() => void handleRemove(share)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
