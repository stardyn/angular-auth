// Export main authentication services and providers
export { AuthService } from './services/AuthService';
export { AuthGuard } from './guards/AuthGuard';
export { LoginGuard } from './guards/LoginGuard';
export { AuthRoleGuard, withPermissions, withPermissionsAndRedirect } from './guards/AuthRoleGuard';
export { XconAuthIfRoleDirective } from './guards/AuthDirective';

// Export configuration and providers
export {
    provideXconAuth,
    provideXconAuthStandard,
    provideXconAuthWithRefresh
} from './auth-factory-main';

// Export classes and utilities
export { XConUserUtils } from './models/XConUserUtils';
export { StandardAuthResponseParser } from './parsers/StandardAuthResponseParser';

// Export types and interfaces
export type { XConUser, XConUserAuthority, XConUserSettings } from './models/XConUser';
export type { XConUserAdditionalInfo } from './models/XConUserAdditionalInfo';
export type { AuthResponse } from './models/AuthResponse';
export type { LoginRequest, LoginMicrosoftRequest } from './models/LoginRequest';
export type { RefreshTokenRequest } from './models/RefreshTokenRequest';
export type { XconCoreAuthConfig } from './models/AuthConfig';
export type { PermissionError } from './guards/AuthRoleGuard';

// Export enums
export { XconPasswordHashType } from './models/AuthConfig';