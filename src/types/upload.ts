export type ChunkUploadStatus =
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'aborted';

export interface StartUploadRequest {
  name: string;
  size: number;
  type: string | null;
  department_id: number;
  total_chunks: number;
  chunk_size: number;
}

export interface StartUploadResponse {
  upload_id: string;
  status: ChunkUploadStatus;
  chunk_size: number;
  total_chunks: number;
  uploaded_chunks: number[];
}

export interface UploadChunkResponse {
  message: string;
  chunk_number: number;
  uploaded_chunks: number[];
}

export interface UploadStatusResponse {
  upload_id: string;
  status: ChunkUploadStatus;
  total_chunks: number;
  uploaded_chunks: number[];
  missing_chunks: number[];
}

export interface CompleteUploadResponse {
  message: string;
  upload_id: string;
  status: ChunkUploadStatus;
  file_id: number;
}

export interface CancelUploadResponse {
  message: string;
  upload_id: string;
  status: ChunkUploadStatus;
}

export type AbortUploadResponse = CancelUploadResponse;
