import {XConUser} from './XConUser';

export interface AuthResponse {
  token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: XConUser;
}
