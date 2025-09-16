import {ModuleConsoleService} from "@stardyn/angular-console";
import {XconCoreAuthConfig, XconPasswordHashType} from "../models/AuthConfig";

export interface AuthEndpoints {
  login: string;
  google: string;
  microsoft: string;
  logout: string;
  refresh: string;
}

export class AuthConfigManager {
  private config: XconCoreAuthConfig = {
    authSiteKey: '',
    authSiteName: '',
    debugMode: true,
    useRefreshToken: false,
    passwordHashType: XconPasswordHashType.MD5_UPPER,
    // Default endpoints for standard mode
    loginEmailEndpoint: '/auth/login-by-email',
    loginGmailEndpoint: '/auth/google',
    loginMicrosoftEndpoint: '/auth/microsoft',
    logoutEndpoint: '/auth/logout',
    refreshTokenEndpoint: '/auth/refresh-token',
    // Default redirect URLs
    redirectLoginUrl: '/login',      // Where user goes to login
    redirectLogoutUrl: null          // Where user goes after logout (if null, use redirectLoginUrl)
  };
  constructor(private dconsole: ModuleConsoleService) {}

  public configure(config: XconCoreAuthConfig): void {
    // Merge configuration with defaults
    this.config = {
      ...this.config,
      ...config,
    };

    this.dconsole.debug('AuthConfigManager configured', this.config);

    // Set default password hash type if not provided
    if (!this.config.passwordHashType) {
      this.config.passwordHashType = XconPasswordHashType.MD5_UPPER;
    }
  }

  public getConfig(): XconCoreAuthConfig {
    return {...this.config};
  }

  // Endpoint getters
  public getLoginEndpoint(): string {
    return this.config.loginEmailEndpoint || '/auth/login-by-email';
  }

  public getGoogleLoginEndpoint(): string {
    return this.config.loginGmailEndpoint || '/auth/google';
  }

  public getMicrosoftLoginEndpoint(): string {
    return this.config.loginMicrosoftEndpoint || '/auth/microsoft';
  }

  public getLogoutEndpoint(): string {
    return this.config.logoutEndpoint || '/auth/logout';
  }

  public getRefreshTokenEndpoint(): string {
    return this.config.refreshTokenEndpoint || '/auth/refresh-token';
  }

  // TB specific endpoint for user info
  public getUserInfoEndpoint(): string {
    return '/api/auth/user';
  }

  public getEndpoints(): AuthEndpoints {
    return {
      login: this.getLoginEndpoint(),
      google: this.getGoogleLoginEndpoint(),
      microsoft: this.getMicrosoftLoginEndpoint(),
      logout: this.getLogoutEndpoint(),
      refresh: this.getRefreshTokenEndpoint()
    };
  }

  // Redirect URL getters - CORRECTED LOGIC
  public getRedirectLoginUrl(): string {
    // Where user goes to login
    return this.config.redirectLoginUrl || '/login';
  }

  public getRedirectLogoutUrl(): string {
    // Where user goes after logout
    // If redirectLogoutUrl is null/undefined, use redirectLoginUrl
    return this.config.redirectLogoutUrl || this.getRedirectLoginUrl();
  }

  // Password hash configuration
  public getPasswordHashType(): XconPasswordHashType {
    return this.config.passwordHashType || XconPasswordHashType.MD5_UPPER;
  }

  public getAuthSiteKey(): string {
    return this.config.authSiteKey || '';
  }

  public getAuthSiteName(): string {
    return this.config.authSiteName || '';
  }
}
