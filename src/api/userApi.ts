import type { User } from '../types';
import { apiGet, apiPost, apiPut } from './apiClient';

export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>('/users');
}

export async function getUserById(userId: string): Promise<User> {
  return apiGet<User>(`/users/${userId}`);
}

export async function createUser(payload: Partial<User>): Promise<User> {
  return apiPost<User>('/users', payload);
}

export async function updateUser(userId: string, payload: Partial<User>): Promise<User> {
  return apiPut<User>(`/users/${userId}`, payload);
}
