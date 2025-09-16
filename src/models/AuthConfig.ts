export enum XconPasswordHashType {
  NONE = 'NONE',
  MD5_UPPER = 'MD5_UPPER',
  SHA256 = 'SHA256'
}

export interface XconCoreAuthConfig {
  authSiteKey?: string;
  authSiteName?: string;
  debugMode?: boolean;
  useRefreshToken?: boolean;
  passwordHashType?: XconPasswordHashType;

  // API Endpoints
  loginEmailEndpoint?: string | null;
  loginGmailEndpoint?: string | null;
  loginMicrosoftEndpoint?: string | null;
  logoutEndpoint?: string | null;
  refreshTokenEndpoint?: string | null;

  // Redirect URLs
  redirectLoginUrl?: string | null;   // Where to redirect after successful login (default: '/dashboard')
  redirectLogoutUrl?: string | null;  // Where to redirect after logout (default: '/login')

  isPermissionEngineActive?: boolean;
}
