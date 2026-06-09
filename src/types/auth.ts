import type { ManagedUser } from './user';

export type CurrentUser = ManagedUser;

export interface LoginResponse {
  token: string;
  user: CurrentUser;
}

export interface CurrentUserResponse {
  user: CurrentUser;
}
