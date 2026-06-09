import type {
  DepartmentFileShare,
  DepartmentShareListResponse,
  DepartmentSharePayload,
  DepartmentShareResponse,
  FileItem,
  FileListResponse,
  FileResponse,
  UploadResponse,
} from '../types/file';
import { apiBlobRequest, apiRequest, buildApiUrl, ApiError } from './apiClient';

export { ApiError, buildApiUrl };

export const uploadFile = async (
  file: File,
  departmentId: string,
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('department_id', departmentId);

  return apiRequest<UploadResponse>('/files/upload', {
    method: 'POST',
    body: formData,
  });
};

export const getFiles = async (): Promise<FileItem[]> => {
  const response = await apiRequest<FileListResponse>('/files');

  return response.data;
};

export const getFile = async (id: number): Promise<FileItem> => {
  const response = await apiRequest<FileResponse>(`/files/${id}`);

  return response.file;
};

export const deleteFile = async (id: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/files/${id}`, {
    method: 'DELETE',
  });
};

export const shareToDepartment = async (
  id: number,
  payload: DepartmentSharePayload,
): Promise<DepartmentShareResponse> => {
  return apiRequest<DepartmentShareResponse>(`/files/${id}/share/department`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getDepartmentShares = async (id: number): Promise<DepartmentFileShare[]> => {
  const response = await apiRequest<DepartmentShareListResponse>(`/files/${id}/shares`);

  return response.data;
};

export const deleteDepartmentShare = async (
  fileId: number,
  shareId: number,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/files/${fileId}/shares/${shareId}`, {
    method: 'DELETE',
  });
};

export const makePrivate = async (id: number): Promise<UploadResponse> => {
  return apiRequest<UploadResponse>(`/files/${id}/private`, {
    method: 'POST',
  });
};

export const createPublicLink = async (
  id: number,
  expiresAt?: string,
): Promise<{
  message: string;
  file: FileItem;
  public: NonNullable<FileItem['public_urls']>;
}> => {
  return apiRequest<{
    message: string;
    file: FileItem;
    public: NonNullable<FileItem['public_urls']>;
  }>(`/files/${id}/public-link`, {
    method: 'POST',
    body: JSON.stringify({ expires_at: expiresAt || null }),
  });
};

export const removePublicLink = async (
  id: number,
): Promise<{ message: string; file: FileItem }> => {
  return apiRequest<{ message: string; file: FileItem }>(`/files/${id}/public-link`, {
    method: 'DELETE',
  });
};

export const getViewUrl = (id: number): string => {
  return buildApiUrl(`/files/${id}/view`);
};

export const getDownloadUrl = (id: number): string => {
  return buildApiUrl(`/files/${id}/download`);
};

export const viewFile = async (id: number): Promise<void> => {
  const blob = await apiBlobRequest(`/files/${id}/view`);
  const url = URL.createObjectURL(blob);

  window.open(url, '_blank', 'noopener,noreferrer');
};

export const downloadFile = async (id: number, fileName: string): Promise<void> => {
  const blob = await apiBlobRequest(`/files/${id}/download`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
