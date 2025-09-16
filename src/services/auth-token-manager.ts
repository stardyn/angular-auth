import {StorageService} from '@stardyn/angular-data-source';
import {ModuleConsoleService} from "@stardyn/angular-console";
import {AuthResponse} from '../models/AuthResponse';
import {XConUser} from '../models/XConUser';

export class AuthTokenManager {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly TOKEN_EXPIRES_KEY = 'token_expires_in';
  private readonly TOKEN_TYPE_KEY = 'token_type';

  constructor(
    private storageService: StorageService,
    private dconsole: ModuleConsoleService
  ) {
  }

  // Token storage methods
  public storeTokens(response: AuthResponse): void {
    this.dconsole.debug('Storing authentication tokens');

    this.storageService.set(this.TOKEN_KEY, response.token);
    this.storageService.set(this.TOKEN_EXPIRES_KEY, this.calculateExpirationTime(response.expires_in));
    this.storageService.set(this.TOKEN_TYPE_KEY, response.token_type);

    this.dconsole.debug('Tokens stored successfully');
  }

  private calculateExpirationTime(expires_in: number): number {
    return Math.floor(Date.now() / 1000) + expires_in;
  }

  public storeUser(user: XConUser): void {
    this.dconsole.debug('Storing user data');
    this.storageService.set(this.USER_KEY, user);
  }

  // Token retrieval methods
  public getToken(): string | null {
    return this.storageService.get(this.TOKEN_KEY, null);
  }

  public getTokenExpiration(): number | null {
    return this.storageService.get(this.TOKEN_EXPIRES_KEY, null);
  }

  public getStoredUser(): XConUser | null {
    return this.storageService.get(this.USER_KEY, null);
  }

  // Clear methods
  public clearTokens(): void {
    this.dconsole.debug('Clearing authentication tokens');

    this.storageService.set(this.TOKEN_KEY, null);
    this.storageService.set(this.TOKEN_EXPIRES_KEY, null);
    this.storageService.set(this.TOKEN_TYPE_KEY, null);
    this.storageService.clear()
    this.dconsole.debug('Tokens cleared successfully');
  }

  public clearUser(): void {
    this.dconsole.debug('Clearing user data');
    this.storageService.set(this.USER_KEY, null);
  }

  public clearAll(): void {
    this.dconsole.debug('Clearing all authentication data');
    this.clearTokens();
    this.clearUser();
  }
}
