import type { Department } from './department';

export interface UploadedBy {
  id: number;
  name: string;
}

export type { Department };

export interface DepartmentFileShare {
  id: number;
  file_id: number;
  from_department_id: number;
  to_department_id: number;
  from_department?: Department | null;
  to_department?: Department | null;
  shared_by?: UploadedBy | null;
  can_view: boolean;
  can_download: boolean;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentSharePayload {
  to_department_id: number;
  can_view: boolean;
  can_download: boolean;
  expires_at?: string | null;
}

export interface FileItem {
  id: number;
  name: string;
  size: number;
  type: string | null;
  uploaded_by: UploadedBy | number | null;
  department?: Department | null;
  department_id?: number | null;
  path: string;
  storage_key?: string | null;
  bucket_name?: string | null;
  visibility: string;
  public_token?: string | null;
  public_expires_at?: string | null;
  public_urls?: {
    view_url: string;
    download_url: string;
    expires_at?: string | null;
  } | null;
  is_encrypted: boolean;
  is_compressed: boolean;
  original_size?: number | null;
  stored_size?: number | null;
  compression_type?: string | null;
  encryption_type?: string | null;
  source?: 'Own Department' | 'Shared With Us' | 'Admin View' | string;
  shared_from_department?: Department | null;
  shared_to_department?: Department | null;
  share_expires_at?: string | null;
  share_can_view?: boolean | null;
  share_can_download?: boolean | null;
  created_at: string;
  updated_at?: string;
}

export interface FileListResponse {
  data: FileItem[];
}

export interface UploadResponse {
  message: string;
  file: FileItem;
}

export interface FileResponse {
  file: FileItem;
}

export interface DepartmentShareListResponse {
  data: DepartmentFileShare[];
}

export interface DepartmentShareResponse {
  message: string;
  share: DepartmentFileShare;
}

export interface ApiValidationErrors {
  [field: string]: string[];
}
