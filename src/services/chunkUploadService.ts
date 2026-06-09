import { apiRequest } from './apiClient';
import type {
  CancelUploadResponse,
  AbortUploadResponse,
  CompleteUploadResponse,
  StartUploadRequest,
  StartUploadResponse,
  UploadChunkResponse,
  UploadStatusResponse,
} from '../types/upload';

export const startUpload = async (payload: StartUploadRequest): Promise<StartUploadResponse> => {
  return apiRequest<StartUploadResponse>('/uploads/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

export const uploadChunk = async (
  uploadId: string,
  chunkNumber: number,
  chunk: Blob,
  signal?: AbortSignal,
): Promise<UploadChunkResponse> => {
  const formData = new FormData();
  formData.append('chunk_number', String(chunkNumber));
  formData.append('chunk', chunk);

  return apiRequest<UploadChunkResponse>(`/uploads/${uploadId}/chunk`, {
    method: 'POST',
    body: formData,
    signal,
  });
};

export const getUploadStatus = async (uploadId: string): Promise<UploadStatusResponse> => {
  return apiRequest<UploadStatusResponse>(`/uploads/${uploadId}/status`);
};

export const pauseUpload = async (uploadId: string): Promise<UploadStatusResponse> => {
  return apiRequest<UploadStatusResponse>(`/uploads/${uploadId}/pause`, {
    method: 'POST',
  });
};

export const resumeUpload = async (uploadId: string): Promise<UploadStatusResponse> => {
  return apiRequest<UploadStatusResponse>(`/uploads/${uploadId}/resume`, {
    method: 'POST',
  });
};

export const completeUpload = async (uploadId: string): Promise<CompleteUploadResponse> => {
  return apiRequest<CompleteUploadResponse>(`/uploads/${uploadId}/complete`, {
    method: 'POST',
  });
};

export const cancelUpload = async (uploadId: string): Promise<CancelUploadResponse> => {
  return apiRequest<CancelUploadResponse>(`/uploads/${uploadId}/cancel`, {
    method: 'DELETE',
  });
};

export const abortUpload = async (uploadId: string): Promise<AbortUploadResponse> => {
  return apiRequest<AbortUploadResponse>(`/uploads/${uploadId}/abort`, {
    method: 'DELETE',
  });
};
