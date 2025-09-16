export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginMicrosoftRequest {
  email: string;
  displayName: string;
  token: string;
}
