import {ApiResponse} from '@stardyn/angular-data-source';
import {SecureUtil} from '@stardyn/angular-helpers';
import {LoginRequest} from '../models/LoginRequest';
import {AuthResponse} from '../models/AuthResponse';
import {XConUser} from '../models/XConUser';
import {ModuleConsoleService} from "@stardyn/angular-console";
import {AuthConfigManager} from './auth-config-manager';
import {AuthDataSourceManager} from './auth-datasource-manager';
import {XconPasswordHashType} from "../models/AuthConfig";
import {StandardAuthResponseParser} from "../parsers/StandardAuthResponseParser";

export class AuthLoginHandler {
  constructor(
    private configManager: AuthConfigManager,
    private dataSourceManager: AuthDataSourceManager,
    private dconsole: ModuleConsoleService
  ) {}

  public async performLogin(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      return await this.performStandardLogin(credentials);
    } catch (error) {
      this.dconsole?.error('Login error:', error);
      throw error;
    }
  }

  // Standard login (single stage)
  private async performStandardLogin(credentials: LoginRequest): Promise<AuthResponse> {
    const loginEndpoint = this.configManager.getLoginEndpoint();

    const loginData = {
      email: credentials.email,
      password: this.hashPassword(credentials.password)
    };

    this.dconsole?.debug('Performing standard login request', {
      endpoint: loginEndpoint,
      email: credentials.email
    });

    const response = await this.dataSourceManager.getDataSourceApi().post(loginEndpoint, loginData);

    if (response.success) {
      return this.parseLoginResponse(response);
    }

    throw new Error(response.message || 'Login failed');
  }

  // Parse login response using appropriate parser
  public parseLoginResponse(response: ApiResponse): AuthResponse {
    return StandardAuthResponseParser.parseLoginResponse(response);
  }

  // Parse refresh response using appropriate parser
  public parseRefreshResponse(response: ApiResponse, currentUser: XConUser | null): AuthResponse {
    return StandardAuthResponseParser.parseRefreshResponse(response, currentUser);
  }

  // Hash password based on configuration
  private hashPassword(password: string): string {
    const hashType = this.configManager.getPasswordHashType();
    const siteKey = this.configManager.getAuthSiteKey();
    const siteName = this.configManager.getAuthSiteName();

    switch (hashType) {
      case XconPasswordHashType.SHA256:
        return SecureUtil.createCaptchaHash(password, siteKey, siteName);

      case XconPasswordHashType.MD5_UPPER:
        return SecureUtil.Md5Upper(password);

      case XconPasswordHashType.NONE:
        return password;

      default:
        this.dconsole?.warn(`Unknown password hash type: ${hashType}, using MD5_UPPER`);
        return SecureUtil.Md5Upper(password);
    }
  }
}
