import { apiRequest } from './apiClient';
import type { Department } from '../types/department';

export interface DepartmentListResponse {
  data: Department[];
}

export interface DepartmentResponse {
  department: Department;
}

export interface DepartmentDeleteResponse {
  message: string;
  files_count?: number;
  used_bytes?: number;
  deleted_files?: number;
  deleted_objects?: number;
  bucket_name?: string | null;
  bucket_deleted?: boolean;
}

export interface DepartmentPayload {
  name: string;
  code?: string | null;
  quota_bytes?: number | null;
}

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiRequest<DepartmentListResponse>('/departments');

  return response.data;
};

export const createDepartment = async (payload: DepartmentPayload): Promise<Department> => {
  const response = await apiRequest<DepartmentResponse>('/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.department;
};

export const updateDepartment = async (
  id: number,
  payload: DepartmentPayload,
): Promise<Department> => {
  const response = await apiRequest<DepartmentResponse>(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.department;
};

export const deleteDepartment = async (
  id: number,
  confirmDeleteData = false,
): Promise<DepartmentDeleteResponse> => {
  const query = confirmDeleteData ? '?confirm_delete_data=true' : '';

  return apiRequest<DepartmentDeleteResponse>(`/departments/${id}${query}`, {
    method: 'DELETE',
  });
};
