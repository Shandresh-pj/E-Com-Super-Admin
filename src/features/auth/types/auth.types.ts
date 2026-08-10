import { UserProfile } from '../../../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: UserProfile;
}
