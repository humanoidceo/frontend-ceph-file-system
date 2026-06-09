import type { Department } from './department';

export type UserRole = 'admin' | 'user';

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
  department?: Department | null;
  max_upload_chunk_bytes: number | null;
  max_download_chunk_bytes: number | null;
  daily_upload_limit_bytes: number | null;
  daily_upload_used_bytes: number;
  daily_upload_available_bytes: number | null;
  daily_download_limit_bytes: number | null;
  daily_download_used_bytes: number;
  daily_download_available_bytes: number | null;
  daily_quota_reset_at: string | null;
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department_id?: number | null;
  max_upload_chunk_bytes?: number | null;
  max_download_chunk_bytes?: number | null;
  daily_upload_limit_bytes?: number | null;
  daily_download_limit_bytes?: number | null;
}
