import { FormEvent, useEffect, useRef, useState } from 'react';
import { DepartmentSelect } from './DepartmentSelect';
import { ProgressBar } from './ProgressBar';
import {
  abortUpload,
  cancelUpload,
  completeUpload,
  getUploadStatus,
  pauseUpload,
  resumeUpload,
  startUpload,
  uploadChunk,
} from '../services/chunkUploadService';
import { ApiError } from '../services/fileService';
import type { ApiValidationErrors, Department } from '../types/file';
import type { CurrentUser } from '../types/auth';
import type { ChunkUploadStatus } from '../types/upload';

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

interface ChunkUploadProps {
  user: CurrentUser;
  departmentRefreshKey: number;
  onComplete: () => Promise<void>;
  onDepartmentChange: (department: Department | null) => void;
  onQuotaChange: () => void;
}

const flattenValidationErrors = (errors?: ApiValidationErrors) => {
  if (!errors) {
    return [];
  }

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

const departmentLabel = (department: Department | null) => {
  if (!department) {
    return 'Select department';
  }

  return department.code ? `${department.name} (${department.code})` : department.name;
};

export function ChunkUpload({
  user,
  departmentRefreshKey,
  onComplete,
  onDepartmentChange,
  onQuotaChange,
}: ChunkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [department, setDepartment] = useState<Department | null>(null);
  const [chunkSizeMb, setChunkSizeMb] = useState(5);
  const [activeChunkSize, setActiveChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [uploadId, setUploadId] = useState('');
  const [status, setStatus] = useState<ChunkUploadStatus | 'idle'>('idle');
  const [uploadedChunks, setUploadedChunks] = useState<number[]>([]);
  const [missingChunks, setMissingChunks] = useState<number[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const pauseRequestedRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const abortRequestedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = (
    nextUploadedChunks: number[],
    nextTotalChunks: number,
    nextMissingChunks?: number[],
  ) => {
    setUploadedChunks(nextUploadedChunks);
    setMissingChunks(
      nextMissingChunks
        ?? Array.from({ length: nextTotalChunks }, (_, index) => index + 1)
          .filter((chunkNumber) => !nextUploadedChunks.includes(chunkNumber)),
    );
    setProgress(nextTotalChunks > 0 ? Math.round((nextUploadedChunks.length / nextTotalChunks) * 100) : 0);
  };

  const resetSession = () => {
    setUploadId('');
    setUploadedChunks([]);
    setMissingChunks([]);
    setTotalChunks(0);
    setProgress(0);
  };

  const selectedChunkSize = chunkSizeMb * 1024 * 1024;
  const exceedsMaxUploadChunkSize = user.max_upload_chunk_bytes !== null
    && selectedChunkSize > user.max_upload_chunk_bytes;
  const exceedsDailyUploadQuota = file
    && user.daily_upload_available_bytes !== null
    && file.size > user.daily_upload_available_bytes;

  useEffect(() => {
    if (!departmentId && user.department_id) {
      setDepartmentId(String(user.department_id));
      setDepartment(user.department ?? null);
      onDepartmentChange(user.department ?? null);
    }
  }, [departmentId, onDepartmentChange, user.department, user.department_id]);

  const uploadChunkNumbers = async (
    nextUploadId: string,
    selectedFile: File,
    chunkNumbers: number[],
    chunkSize: number,
    nextTotalChunks: number,
    initialUploadedChunks: number[],
  ) => {
    setIsRunning(true);
    setStatus('uploading');

    try {
      for (const chunkNumber of chunkNumbers) {
        if (pauseRequestedRef.current || cancelRequestedRef.current || abortRequestedRef.current) {
          return;
        }

        const start = (chunkNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, selectedFile.size);
        const chunk = selectedFile.slice(start, end);
        abortControllerRef.current = new AbortController();

        try {
          const response = await uploadChunk(
            nextUploadId,
            chunkNumber,
            chunk,
            abortControllerRef.current.signal,
          );
          updateProgress(response.uploaded_chunks, nextTotalChunks);
        } catch (requestError) {
          if (cancelRequestedRef.current || abortRequestedRef.current || pauseRequestedRef.current) {
            return;
          }

          throw requestError;
        } finally {
          abortControllerRef.current = null;
        }
      }

      if (pauseRequestedRef.current || cancelRequestedRef.current || abortRequestedRef.current) {
        return;
      }

      const latestStatus = await getUploadStatus(nextUploadId);
      setStatus(latestStatus.status);
      updateProgress(latestStatus.uploaded_chunks, latestStatus.total_chunks, latestStatus.missing_chunks);

      if (latestStatus.missing_chunks.length > 0) {
        setMessage('Upload is still missing chunks. Resume to continue.');
        return;
      }

      const completed = await completeUpload(nextUploadId);
      setStatus(completed.status);
      setMessage(`${completed.message}. Final file ID: ${completed.file_id}`);
      onQuotaChange();
      await onComplete();
    } catch (uploadError) {
      setError(formatError(uploadError));
    } finally {
      setIsRunning(false);
    }
  };

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError('Choose a file before starting chunk upload.');
      return;
    }

    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    abortRequestedRef.current = false;
    setError('');
    setMessage('');
    updateProgress([], 0, []);

    if (exceedsDailyUploadQuota) {
      setError('Your 24-hour upload limit has been exceeded.');
      return;
    }

    if (exceedsMaxUploadChunkSize) {
      setError('This chunk is larger than your allowed upload chunk size.');
      return;
    }

    const nextChunkSize = selectedChunkSize;
    const nextTotalChunks = Math.ceil(file.size / nextChunkSize);

    try {
      const response = await startUpload({
        name: file.name,
        size: file.size,
        type: file.type || null,
        department_id: Number(departmentId),
        total_chunks: nextTotalChunks,
        chunk_size: nextChunkSize,
      });

      setUploadId(response.upload_id);
      setStatus(response.status);
      setActiveChunkSize(response.chunk_size);
      setTotalChunks(response.total_chunks);
      updateProgress(response.uploaded_chunks, response.total_chunks);

      const chunksToUpload = Array.from({ length: response.total_chunks }, (_, index) => index + 1)
        .filter((chunkNumber) => !response.uploaded_chunks.includes(chunkNumber));

      await uploadChunkNumbers(
        response.upload_id,
        file,
        chunksToUpload,
        response.chunk_size,
        response.total_chunks,
        response.uploaded_chunks,
      );
    } catch (startError) {
      setStatus('idle');
      setError(formatError(startError));
      setIsRunning(false);
    }
  };

  const handlePause = async () => {
    if (!uploadId) {
      return;
    }

    pauseRequestedRef.current = true;
    setError('');

    try {
      const response = await pauseUpload(uploadId);
      setStatus(response.status);
      updateProgress(response.uploaded_chunks, response.total_chunks, response.missing_chunks);
      setMessage('Upload paused.');
    } catch (pauseError) {
      setError(formatError(pauseError));
    } finally {
      setIsRunning(false);
    }
  };

  const handleResume = async () => {
    if (!uploadId || !file) {
      setError('Select the same file before resuming this upload.');
      return;
    }

    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    abortRequestedRef.current = false;
    setError('');
    setMessage('');

    try {
      const response = await resumeUpload(uploadId);
      setStatus(response.status);
      setTotalChunks(response.total_chunks);
      updateProgress(response.uploaded_chunks, response.total_chunks, response.missing_chunks);

      await uploadChunkNumbers(
        uploadId,
        file,
        response.missing_chunks,
        activeChunkSize,
        response.total_chunks,
        response.uploaded_chunks,
      );
    } catch (resumeError) {
      setError(formatError(resumeError));
      setIsRunning(false);
    }
  };

  const handleCancel = async () => {
    if (!uploadId) {
      return;
    }

    const confirmed = window.confirm('Cancel this upload and delete its temporary chunks?');

    if (!confirmed) {
      return;
    }

    cancelRequestedRef.current = true;
    pauseRequestedRef.current = false;
    abortRequestedRef.current = false;
    abortControllerRef.current?.abort();
    setError('');

    try {
      const response = await cancelUpload(uploadId);
      setStatus(response.status);
      setMessage(response.message);
      resetSession();
    } catch (cancelError) {
      setError(formatError(cancelError));
    } finally {
      setIsRunning(false);
    }
  };

  const handleAbort = async () => {
    if (!uploadId) {
      return;
    }

    const confirmed = window.confirm('Stop this upload immediately? It cannot be resumed.');

    if (!confirmed) {
      return;
    }

    abortRequestedRef.current = true;
    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    abortControllerRef.current?.abort();
    setError('');

    try {
      const response = await abortUpload(uploadId);
      setStatus(response.status);
      setMessage(response.message);
      resetSession();
    } catch (abortError) {
      setError(formatError(abortError));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="panel chunk-upload">
      <div className="panel-heading">
        <div>
          <h2>Upload File</h2>
          <p>Chunk upload with pause, resume, cancel, and stop controls.</p>
        </div>
      </div>

      <form onSubmit={handleStart}>
        <div className="upload-grid">
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
            onDepartmentChange={(nextDepartment) => {
              setDepartment(nextDepartment);
              onDepartmentChange(nextDepartment);
            }}
            refreshKey={departmentRefreshKey}
            disabled={isRunning}
          />

          <label>
            <span>Chunk size</span>
            <select
              value={chunkSizeMb}
              disabled={isRunning || Boolean(uploadId)}
              onChange={(event) => setChunkSizeMb(Number(event.target.value))}
            >
              <option value={1}>1 MB</option>
              <option value={5}>5 MB</option>
              <option value={10}>10 MB</option>
              <option value={25}>25 MB</option>
            </select>
          </label>
        </div>

        {exceedsMaxUploadChunkSize && (
          <div className="alert warning">
            This chunk is larger than your allowed upload chunk size. Choose {formatBytes(user.max_upload_chunk_bytes)} or smaller.
          </div>
        )}

        {exceedsDailyUploadQuota && (
          <div className="alert error">
            Your 24-hour upload limit has been exceeded.
          </div>
        )}

        <div className="chunk-actions">
          <button className="primary-button" disabled={isRunning || !file || !departmentId || Boolean(exceedsDailyUploadQuota) || exceedsMaxUploadChunkSize}>
            {isRunning ? 'Uploading...' : 'Start Upload'}
          </button>
          <button className="warning-button" type="button" disabled={!uploadId || !isRunning} onClick={handlePause}>
            Pause
          </button>
          <button className="success-button" type="button" disabled={!uploadId || isRunning || status !== 'paused'} onClick={handleResume}>
            Resume
          </button>
          <button className="danger-button" type="button" disabled={!uploadId || status === 'completed'} onClick={handleCancel}>
            Cancel
          </button>
          <button className="danger-button" type="button" disabled={!uploadId || status === 'completed'} onClick={handleAbort}>
            Abort/Stop
          </button>
        </div>
      </form>

      <ProgressBar value={progress} />

      <div className="upload-status-grid">
        <div className="metric-card wide-metric">
          <span>Selected file</span>
          <strong>{file ? file.name : 'None'}</strong>
        </div>
        <div className="metric-card">
          <span>File size</span>
          <strong>{file ? formatBytes(file.size) : '0 B'}</strong>
        </div>
        <div className="metric-card">
          <span>Department</span>
          <strong>{departmentLabel(department)}</strong>
        </div>
        <div className="metric-card">
          <span>Chunk size</span>
          <strong>{formatBytes(uploadId ? activeChunkSize : selectedChunkSize)}</strong>
        </div>
        <div className="metric-card">
          <span>Max upload chunk</span>
          <strong>{formatBytes(user.max_upload_chunk_bytes)}</strong>
        </div>
        <div className="metric-card">
          <span>Daily upload available</span>
          <strong>{formatBytes(user.daily_upload_available_bytes)}</strong>
        </div>
        <div className="metric-card">
          <span>Status</span>
          <strong>
            <span className={`status upload-status upload-status-${status}`}>{status}</span>
          </strong>
        </div>
        <div className="metric-card">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="metric-card">
          <span>Total chunks</span>
          <strong>{totalChunks}</strong>
        </div>
        <div className="metric-card">
          <span>Uploaded chunks</span>
          <strong>{uploadedChunks.length}</strong>
        </div>
        <div className="metric-card">
          <span>Missing chunks</span>
          <strong>{missingChunks.length}</strong>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
    </section>
  );
}
