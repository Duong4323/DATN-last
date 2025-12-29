export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}