import { Fragment, useState } from 'react';
import { DepartmentSharePanel } from './DepartmentSharePanel';
import { PublicLinkPanel } from './PublicLinkPanel';
import type { CurrentUser } from '../types/auth';
import type { DepartmentSharePayload, FileItem } from '../types/file';

interface FileTableProps {
  user: CurrentUser;
  files: FileItem[];
  actionId: string | null;
  onView: (id: number) => void;
  onDownload: (id: number) => void;
  onShareToDepartment: (id: number, payload: DepartmentSharePayload) => Promise<void>;
  onRemoveDepartmentShare: (id: number, shareId: number) => Promise<void>;
  onCreatePublicLink: (id: number, expiresAt?: string) => void;
  onRemovePublicLink: (id: number) => void;
  onCopyPublicLink: (url: string) => void;
  onDelete: (id: number) => void;
}

const formatBytes = (size: number) => {
  if (size === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const departmentLabel = (file: FileItem) => {
  if (file.department) {
    return file.department.code
      ? `${file.department.name} (${file.department.code})`
      : file.department.name;
  }

  return file.department_id ? `Department #${file.department_id}` : 'None';
};

const uploadedByLabel = (file: FileItem) => {
  if (!file.uploaded_by) {
    return 'None';
  }

  if (typeof file.uploaded_by === 'number') {
    return `User #${file.uploaded_by}`;
  }

  return file.uploaded_by.name;
};

const booleanBadge = (value: boolean) => (
  <span className={`status ${value ? 'badge-success' : 'badge-neutral'}`}>
    {value ? 'Yes' : 'No'}
  </span>
);

export function FileTable({
  user,
  files,
  actionId,
  onView,
  onDownload,
  onShareToDepartment,
  onRemoveDepartmentShare,
  onCreatePublicLink,
  onRemovePublicLink,
  onCopyPublicLink,
  onDelete,
}: FileTableProps) {
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [publicPanelId, setPublicPanelId] = useState<number | null>(null);
  const [sharePanelId, setSharePanelId] = useState<number | null>(null);
  const sourceClass = (file: FileItem) => {
    if (file.source === 'Shared With Us') return 'source-shared';
    if (file.source === 'Admin View') return 'source-admin';

    return 'source-own';
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Size</th>
            <th>Type</th>
            <th>Department</th>
            <th>Uploaded By</th>
            <th>Source</th>
            <th>Visibility</th>
            <th>Encrypted</th>
            <th>Compressed</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const isActionRunning = actionId?.endsWith(`-${file.id}`) ?? false;

            return (
              <Fragment key={file.id}>
                <tr>
                  <td>{file.id}</td>
                  <td className="file-name">{file.name}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td>{file.type ?? 'Unknown'}</td>
                  <td>{departmentLabel(file)}</td>
                  <td>{uploadedByLabel(file)}</td>
                  <td>
                    <span className={`status ${sourceClass(file)}`}>
                      {file.source ?? 'Own Department'}
                    </span>
                  </td>
                  <td>
                    <span className={`status status-${file.visibility}`}>
                      {file.visibility}
                    </span>
                  </td>
                  <td>{booleanBadge(file.is_encrypted)}</td>
                  <td>{booleanBadge(file.is_compressed)}</td>
                  <td>{formatDate(file.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="primary-button" type="button" onClick={() => onView(file.id)}>
                        View
                      </button>
                      <button className="success-button" type="button" onClick={() => onDownload(file.id)}>
                        Download
                      </button>
                      <button
                        className="info-button"
                        type="button"
                        disabled={isActionRunning || (user.role !== 'admin' && file.source === 'Shared With Us')}
                        onClick={() => setSharePanelId(sharePanelId === file.id ? null : file.id)}
                      >
                        Share Dept
                      </button>
                      <button
                        className="warning-button"
                        type="button"
                        disabled={isActionRunning}
                        onClick={() => setPublicPanelId(publicPanelId === file.id ? null : file.id)}
                      >
                        Public Link
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setDetailsId(detailsId === file.id ? null : file.id)}
                      >
                        Details
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        disabled={isActionRunning}
                        onClick={() => onDelete(file.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {publicPanelId === file.id && (
                  <tr className="details-row">
                    <td colSpan={12}>
                      <PublicLinkPanel
                        file={file}
                        isBusy={isActionRunning}
                        onCreate={onCreatePublicLink}
                        onRemove={onRemovePublicLink}
                        onCopy={onCopyPublicLink}
                      />
                    </td>
                  </tr>
                )}
                {sharePanelId === file.id && (
                  <tr className="details-row">
                    <td colSpan={12}>
                      <DepartmentSharePanel
                        file={file}
                        user={user}
                        isBusy={isActionRunning}
                        onCreate={onShareToDepartment}
                        onRemove={onRemoveDepartmentShare}
                      />
                    </td>
                  </tr>
                )}
                {detailsId === file.id && (
                  <tr className="details-row">
                    <td colSpan={12}>
                      <div className="inline-panel metadata-panel">
                        <div>
                          <span>Bucket name</span>
                          <strong className="path-cell">{file.bucket_name ?? 'Default bucket'}</strong>
                        </div>
                        <div>
                          <span>Storage key</span>
                          <strong className="path-cell">{file.storage_key ?? file.path}</strong>
                        </div>
                        <div>
                          <span>Original size</span>
                          <strong>{formatBytes(file.original_size ?? file.size)}</strong>
                        </div>
                        <div>
                          <span>Stored size</span>
                          <strong>{file.stored_size ? formatBytes(file.stored_size) : 'Unknown'}</strong>
                        </div>
                        <div>
                          <span>Encrypted</span>
                          <strong>{booleanBadge(file.is_encrypted)}</strong>
                        </div>
                        <div>
                          <span>Compressed</span>
                          <strong>{booleanBadge(file.is_compressed)}</strong>
                        </div>
                        <div>
                          <span>Compression</span>
                          <strong>{file.compression_type ?? 'None'}</strong>
                        </div>
                        <div>
                          <span>Encryption</span>
                          <strong>{file.encryption_type ?? 'None'}</strong>
                        </div>
                        <div>
                          <span>Public expiry</span>
                          <strong>{file.public_expires_at ? formatDate(file.public_expires_at) : 'No expiry'}</strong>
                        </div>
                        {file.source === 'Shared With Us' && (
                          <>
                            <div>
                              <span>Shared from</span>
                              <strong>{departmentLabel({ ...file, department: file.shared_from_department })}</strong>
                            </div>
                            <div>
                              <span>Share expiry</span>
                              <strong>{file.share_expires_at ? formatDate(file.share_expires_at) : 'No expiry'}</strong>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
