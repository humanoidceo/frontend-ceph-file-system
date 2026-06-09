import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from './apiClient';
import type { CurrentUser, CurrentUserResponse, LoginResponse } from '../types/auth';

export const getToken = () => getStoredToken();

export const setToken = (token: string) => {
  setStoredToken(token);
};

export const clearToken = () => {
  clearStoredToken();
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setToken(response.token);

  return response;
};

export const logout = async (): Promise<void> => {
  try {
    await apiRequest<{ message: string }>('/logout', {
      method: 'POST',
    });
  } finally {
    clearToken();
  }
};

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await apiRequest<CurrentUserResponse>('/user');

  return response.user;
};
