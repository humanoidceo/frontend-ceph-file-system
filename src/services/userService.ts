import { apiRequest } from './apiClient';
import type { ManagedUser, UserPayload } from '../types/user';

interface UserListResponse {
  data: ManagedUser[];
}

interface UserResponse {
  user: ManagedUser;
}

export const getUsers = async (): Promise<ManagedUser[]> => {
  const response = await apiRequest<UserListResponse>('/users');

  return response.data;
};

export const getUser = async (id: number): Promise<ManagedUser> => {
  const response = await apiRequest<UserResponse>(`/users/${id}`);

  return response.user;
};

export const createUser = async (payload: UserPayload): Promise<ManagedUser> => {
  const response = await apiRequest<UserResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.user;
};

export const updateUser = async (id: number, payload: UserPayload): Promise<ManagedUser> => {
  const response = await apiRequest<UserResponse>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
};

export const deleteUser = async (id: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/users/${id}`, {
    method: 'DELETE',
  });
};

export const updateUserLimits = async (
  id: number,
  payload: Pick<
    UserPayload,
    | 'max_upload_chunk_bytes'
    | 'max_download_chunk_bytes'
    | 'daily_upload_limit_bytes'
    | 'daily_download_limit_bytes'
  >,
): Promise<ManagedUser> => {
  const response = await apiRequest<UserResponse>(`/users/${id}/limits`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
};
