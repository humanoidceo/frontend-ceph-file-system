import { useState } from 'react';
import type { FileItem } from '../types/file';

interface PublicLinkPanelProps {
  file: FileItem;
  isBusy: boolean;
  onCreate: (id: number, expiresAt?: string) => void;
  onRemove: (id: number) => void;
  onCopy: (url: string) => void;
}

export function PublicLinkPanel({
  file,
  isBusy,
  onCreate,
  onRemove,
  onCopy,
}: PublicLinkPanelProps) {
  const [expiresAt, setExpiresAt] = useState('');

  return (
    <div className="inline-panel public-panel">
      <div className="public-panel-form">
        <label>
          <span>Optional expiry</span>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>
        <button className="primary-button" type="button" disabled={isBusy} onClick={() => onCreate(file.id, expiresAt)}>
          Create Public Link
        </button>
        <button className="danger-button" type="button" disabled={isBusy || !file.public_token} onClick={() => onRemove(file.id)}>
          Remove Public Link
        </button>
      </div>

      {file.public_urls?.view_url ? (
        <div className="public-link-output">
          <a href={file.public_urls.view_url} target="_blank" rel="noreferrer">
            {file.public_urls.view_url}
          </a>
          <button className="info-button" type="button" onClick={() => onCopy(file.public_urls!.view_url)}>
            Copy
          </button>
        </div>
      ) : (
        <p className="muted-text">No public link has been created for this file.</p>
      )}
    </div>
  );
}
