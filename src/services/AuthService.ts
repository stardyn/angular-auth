import {Injectable, Optional} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  ApiResponse,
  DataSource,
  DataSourceApi,
  DataSourceWithRefresh,
  DataSourceWithRefreshApi,
  StorageService
} from '@stardyn/angular-data-source';
import {LoginMicrosoftRequest, LoginRequest} from '../models/LoginRequest';
import {AuthResponse} from '../models/AuthResponse';
import {XConUser} from '../models/XConUser';
import {ModuleConsoleService} from "@stardyn/angular-console";
import {XconCoreAuthConfig} from "../models/AuthConfig";
import {AuthConfigManager} from './auth-config-manager';
import {AuthTokenManager} from './auth-token-manager';
import {AuthDataSourceManager} from './auth-datasource-manager';
import {AuthLoginHandler} from './auth-login-handler';
import {RefreshTokenRequest} from '../models/RefreshTokenRequest';

@Injectable()
export class AuthService {
  private dconsole: ModuleConsoleService;
  private configManager: AuthConfigManager;
  private tokenManager: AuthTokenManager;
  private dataSourceManager: AuthDataSourceManager;
  private loginHandler: AuthLoginHandler;

  private currentUserSubject = new BehaviorSubject<XConUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private router: Router,
    private storageService: StorageService,
    consoleService: ModuleConsoleService,
    @Optional() dataSource?: DataSource,
    @Optional() dataSourceApi?: DataSourceApi,
    @Optional() dataSourceWithRefresh?: DataSourceWithRefresh,
    @Optional() dataSourceWithRefreshApi?: DataSourceWithRefreshApi,
  ) {
    this.dconsole = consoleService;
    this.dconsole.debug('AuthService initialized');

    // Initialize sub-managers
    this.configManager = new AuthConfigManager(this.dconsole);
    this.tokenManager = new AuthTokenManager(this.storageService, this.dconsole);
    this.dataSourceManager = new AuthDataSourceManager(
      this.dconsole,
      dataSource,
      dataSourceApi,
      dataSourceWithRefresh,
      dataSourceWithRefreshApi,
    );
    this.loginHandler = new AuthLoginHandler(
      this.configManager,
      this.dataSourceManager,
      this.dconsole
    );
  }

  public configure(config: XconCoreAuthConfig): void {
    this.configManager.configure(config);
    this.dataSourceManager.validateDependencies(this.configManager.getConfig());
  }

  // Initialize auth service
  async initialize(): Promise<void> {
    this.dconsole.info('AuthService Initializing with endpoints:', this.configManager.getEndpoints());
    this.loadStoredAuth();
  }

  // Login with email and password
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      this.loginHandler.performLogin(credentials).then(authResponse => {
        this.handleAuthSuccess(authResponse);
        observer.next(authResponse);
        observer.complete();
      }).catch(error => {
        observer.error(this.handleAuthError(error));
      });
    });
  }

  loginWithEmail(credentials: LoginRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      this.loginHandler.performLogin(credentials).then(authResponse => {
        this.handleAuthSuccess(authResponse);
        observer.next(authResponse);
        observer.complete();
      }).catch(error => {
        observer.error(this.handleAuthError(error));
      });
    });
  }

  // Social login methods
  loginWithGoogle(): Observable<AuthResponse> {
    return new Observable(observer => {
      const googleEndpoint = this.configManager.getGoogleLoginEndpoint();
      this.dconsole?.debug('Performing Google login request', {endpoint: googleEndpoint});

      this.dataSourceManager.getDataSourceApi().post(googleEndpoint, {}).then(response => {
        if (response.success) {
          const authResponse = this.loginHandler.parseLoginResponse(response);
          this.handleAuthSuccess(authResponse);
          observer.next(authResponse);
          observer.complete();
        } else {
          observer.error(new Error(response.message || 'Google login failed'));
        }
      }).catch(error => {
        observer.error(this.handleAuthError(error));
      });
    });
  }

  loginWithMicrosoft(credentials: LoginMicrosoftRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      const microsoftEndpoint = this.configManager.getMicrosoftLoginEndpoint();
      this.dconsole?.debug('Performing Microsoft login request', {endpoint: microsoftEndpoint});

      this.dataSourceManager.getDataSourceApi().post(microsoftEndpoint, credentials).then(response => {
        if (response.success) {
          const authResponse = this.loginHandler.parseLoginResponse(response);
          this.handleAuthSuccess(authResponse);
          observer.next(authResponse);
          observer.complete();
        } else {
          observer.error(new Error(response.message || 'Microsoft login failed'));
        }
      }).catch(error => {
        observer.error(this.handleAuthError(error));
      });
    });
  }

// Logout with automatic redirect
  async logout(): Promise<void> {
    console.log('🔴 LOGOUT: Starting logout process...');

    try {
      const logoutData: any = {};
      const logoutEndpoint = this.configManager.getLogoutEndpoint();
      console.log('🔴 LOGOUT: Making API call to:', logoutEndpoint);

      this.dconsole?.debug('Performing logout request', {endpoint: logoutEndpoint});

      const response = await this.dataSourceManager.getDataSourceApi().post(logoutEndpoint, logoutData);
      console.log('🔴 LOGOUT: API response:', response);

    } catch (error) {
      console.error('🔴 LOGOUT: API call failed:', error);
      this.dconsole?.error('Logout API call failed:', error);
    }

    console.log('🔴 LOGOUT: Clearing auth data...');
    // Clear auth data first
    this.clearAuthData();

    console.log('🔴 LOGOUT: Performing redirect...');
    // Then redirect to login page
    await this.performLogoutRedirect();
  }

// Logout without API call, just clear data and redirect
  async logoutLocal(): Promise<void> {
    console.log('🔴 LOCAL LOGOUT: Starting local logout...');
    this.dconsole?.debug('Performing local logout (no API call)');
    this.clearAuthData();
    await this.performLogoutRedirect();
  }

// Redirect after logout - goes to login page (redirectLoginUrl)
  async performLogoutRedirect(): Promise<void> {
    try {
      // Get the login URL (where user should go after logout)
      const loginUrl = this.configManager.getRedirectLoginUrl();

      console.log('🔴 REDIRECT: Redirecting to login page:', loginUrl);
      console.log('🔴 REDIRECT: Current URL:', this.router.url);

      this.dconsole?.debug('Redirecting after logout to login page:', loginUrl);

      // Navigate to login page
      const result = await this.router.navigate([loginUrl], {
        replaceUrl: true
      });

      console.log('🔴 REDIRECT: Navigation result:', result);

      if (!result) {
        console.warn('🔴 REDIRECT: Angular router failed, using window.location');
        window.location.href = loginUrl;
      }

    } catch (error) {
      console.error('🔴 REDIRECT: Redirect failed:', error);
      this.dconsole?.error('Logout redirect failed:', error);

      // Fallback redirect to login
      const fallbackUrl = '/login';
      console.log('🔴 REDIRECT: Using fallback URL:', fallbackUrl);
      window.location.href = fallbackUrl;
    }
  }

// Legacy method for compatibility - redirects to login page after logout
  async redirectLogout(): Promise<void> {
    console.log('🔴 REDIRECT_LOGOUT: Called (legacy method)');
    await this.performLogoutRedirect();
  }

  // Token refresh
  async refreshToken(): Promise<ApiResponse> {
    const config = this.configManager.getConfig();

    if (!config.useRefreshToken) {
      this.dconsole?.warn('Refresh token is disabled in configuration');
      return ApiResponse.create({success: false, message: 'Refresh token not supported'});
    }

    try {
      const refreshData: RefreshTokenRequest = {refresh_token: ''};
      const refreshEndpoint = this.configManager.getRefreshTokenEndpoint();
      this.dconsole?.debug('Performing token refresh request', {endpoint: refreshEndpoint});

      const response = await this.dataSourceManager.getDataSourceApi().post(refreshEndpoint, refreshData);

      if (response.success) {
        const refreshResponse = this.loginHandler.parseRefreshResponse(response, this.getCurrentUser());
        this.handleRefreshSuccess(refreshResponse);
        return response;
      }

      this.clearAuthData();
      return response;
    } catch (error) {
      this.dconsole?.error('Token refresh failed:', error);
      this.clearAuthData();
      return ApiResponse.create({success: false, message: 'Token refresh failed'});
    }
  }

  // Get current user
  getCurrentUser(): XConUser | null {
    return this.currentUserSubject.value;
  }

  getConfiguration(): XconCoreAuthConfig {
    return this.configManager.getConfig();
  }

  // Private helper methods
  private handleAuthSuccess(authResponse: AuthResponse): void {
    this.tokenManager.storeTokens(authResponse);
    this.tokenManager.storeUser(authResponse.user);
    this.dataSourceManager.setToken(authResponse.token);

    this.currentUserSubject.next(authResponse.user);
    this.setAuthState(true);

    const config = this.configManager.getConfig();

    if (config.useRefreshToken) {
      this.scheduleTokenRefresh();
    }

    this.dconsole?.log('Auth success handled, user:', authResponse.user);
  }

  private handleRefreshSuccess(authResponse: AuthResponse): void {
    this.tokenManager.storeTokens(authResponse);
    this.dataSourceManager.setToken(authResponse.token);
    this.scheduleTokenRefresh();
    this.dconsole?.log('Token refresh successful, new token set');
  }

  private handleAuthError(error: any): Error {
    this.dconsole?.error('Authentication error:', error);
    this.clearAuthData();

    if (error.response) {
      switch (error.response.status) {
        case 401:
          return new Error('Invalid credentials');
        case 403:
          return new Error('Access forbidden');
        case 422:
          return new Error('Invalid input data');
        case 500:
          return new Error('Server error');
        default:
          return new Error('Authentication failed');
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network connection failed');
    }

    return new Error(error.message || 'Authentication failed');
  }

  private clearAuthData(): void {
    this.tokenManager.clearAll();
    this.dataSourceManager.clearToken();
    this.currentUserSubject.next(null);
    this.clearTokenRefreshTimer();
    this.setAuthState(false);
  }

  private loadStoredAuth(): void {
    const userData = this.tokenManager.getStoredUser();
    const token = this.tokenManager.getToken();
    const expiresIn = this.tokenManager.getTokenExpiration();

    this.dconsole.info('AuthService loadStoredAuth:', token, expiresIn);

    if (userData && token && expiresIn) {
      try {
        const currentTime = Math.floor(Date.now() / 1000);

        this.dconsole.info('AuthService loadStoredAuth:', currentTime, expiresIn);

        if (currentTime < expiresIn) {
          this.currentUserSubject.next(userData);
          this.setAuthState(true);
          this.dataSourceManager.setToken(token);
          this.dconsole?.log('Stored auth loaded successfully, user:', userData);
        } else {
          this.dconsole?.log('Stored token expired, clearing auth data');
          this.clearAuthData();
        }
      } catch (error) {
        this.dconsole?.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    } else {
      this.dconsole?.log('No valid stored auth found');
    }
  }

  private setAuthState(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      this.scheduleTokenRefresh();
    } else {
      this.clearTokenRefreshTimer();
    }
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  private tokenExpirationTimer: any;

  private scheduleTokenRefresh(): void {

    const config = this.configManager.getConfig();

    if (!config.useRefreshToken) {
      this.dconsole.info('AuthService refresh token disabled.');
      return;
    }

    const expiresIn = this.tokenManager.getTokenExpiration();

    if (!expiresIn) {
      this.dconsole.info('AuthService scheduleTokenRefresh expiresIn:', expiresIn);
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expiresIn - currentTime;
    const refreshTime = Math.max(timeUntilExpiration - (5 * 60), 60);

    this.dconsole.info('AuthService scheduleTokenRefresh :', currentTime, timeUntilExpiration, refreshTime);

    if (refreshTime > 0) {
      this.dconsole?.log(`Token refresh scheduled in ${refreshTime} seconds`);
      this.tokenExpirationTimer = setTimeout(() => {
        this.dconsole?.log('Attempting scheduled token refresh...');
        this.refreshToken();
      }, refreshTime * 1000);
    } else {
      this.dconsole?.log('Token will expire soon, refreshing immediately');
      this.refreshToken();
    }
  }

  private clearTokenRefreshTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }
}
