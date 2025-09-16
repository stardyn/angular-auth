import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/AuthService';
import { XConUserUtils } from '../models/XConUserUtils';

/**
 * Enhanced role-based route guard with permission checks and redirect support
 *
 * Usage in routes:
 *
 * Basic permission check (throws error on fail):
 * canActivate: [AuthRoleGuard]
 * data: { permissions: 'DEVICE_READ' }
 *
 * Permission check with redirect (redirects on fail):
 * canActivate: [AuthRoleGuard]
 * data: {
 *   permissions: 'ADMIN_PANEL',
 *   permissionRedirectTo: '/unauthorized'
 * }
 *
 * Both pipe and array syntax supported:
 * data: { permissions: 'DEVICE_READ | DEVICE_WRITE' }
 * data: { permissions: ['DEVICE_READ', 'DEVICE_WRITE'] }
 */
@Injectable({
  providedIn: 'root'
})
export class AuthRoleGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkPermissions(route, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkPermissions(childRoute, state.url);
  }

  private checkPermissions(route: ActivatedRouteSnapshot, url: string): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          // User is not authenticated
          console.error('🔒 AUTH_ERROR: User not authenticated for route:', url);
          this.handleUnauthenticated(route, url);
          return false;
        }

        // Get required permissions from route data
        const requiredPermissions = route.data?.['permissions'];
        const redirectTo = route.data?.['permissionRedirectTo'];

        if (!requiredPermissions) {
          // No permissions specified, allow access for authenticated users
          return true;
        }

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          console.error('🔒 AUTH_ERROR: No current user found');
          this.handleUnauthenticated(route, url);
          return false;
        }

        // Parse permissions (support pipe syntax and arrays)
        const permissions = this.parsePermissions(requiredPermissions);

        // Check if user has any of the required permissions
        const hasPermission = XConUserUtils.hasAnyPermission(currentUser, permissions);

        if (!hasPermission) {
          console.error('🔒 PERMISSION_ERROR:', {
            url: url,
            requiredPermissions: permissions,
            userPermissions: currentUser.permissions || [],
            userId: currentUser.user_id,
            userEmail: currentUser.email
          });

          // Handle permission denied - redirect or throw error
          if (redirectTo) {
            // CRITICAL: Prevent infinite loop by checking current URL
            if (url === redirectTo || url.startsWith(`${redirectTo}?`) || url.startsWith(`${redirectTo}/`)) {
              console.warn('AuthRoleGuard: Already on redirect target page, preventing redirect loop');
              return false;
            }

            // Check browser URL to prevent loops
            const browserUrl = this.router.url;
            if (browserUrl === redirectTo || browserUrl.startsWith(`${redirectTo}?`) || browserUrl.startsWith(`${redirectTo}/`)) {
              console.warn('AuthRoleGuard: Browser already on redirect target page, preventing redirect loop');
              return false;
            }

            console.log('🔀 PERMISSION_REDIRECT:', `Redirecting to ${redirectTo} due to insufficient permissions`);
            this.router.navigate([redirectTo], {
              replaceUrl: true,
              queryParams: { reason: 'insufficient_permissions', required: permissions.join(',') }
            }).catch(error => {
              console.error('AuthRoleGuard: Navigation error:', error);
            });
          } else {
            this.throwUnauthorizedError(`Access denied. Required permissions: ${permissions.join(' OR ')}`);
          }

          return false;
        }

        console.log('✅ ACCESS_GRANTED:', {
          url: url,
          requiredPermissions: permissions,
          userId: currentUser.user_id
        });

        return true;
      })
    );
  }

  private parsePermissions(permissions: string | string[]): string[] {
    if (typeof permissions === 'string') {
      // Pipe syntax: "PERM1 | PERM2 | PERM3"
      if (permissions.includes('|')) {
        return permissions
          .split('|')
          .map(p => p.trim())
          .filter(p => p.length > 0);
      } else {
        // Single permission: "PERM1"
        return [permissions.trim()];
      }
    } else {
      // Array syntax: ["PERM1", "PERM2"]
      return permissions;
    }
  }

  private handleUnauthenticated(route: ActivatedRouteSnapshot, url: string): void {
    const redirectTo = route.data?.['permissionRedirectTo'];

    if (redirectTo) {
      // CRITICAL: Prevent infinite loop by checking current URL
      if (url === redirectTo || url.startsWith(`${redirectTo}?`) || url.startsWith(`${redirectTo}/`)) {
        console.warn('AuthRoleGuard: Already on redirect target page (unauthenticated), preventing redirect loop');
        return;
      }

      // Check browser URL to prevent loops
      const browserUrl = this.router.url;
      if (browserUrl === redirectTo || browserUrl.startsWith(`${redirectTo}?`) || browserUrl.startsWith(`${redirectTo}/`)) {
        console.warn('AuthRoleGuard: Browser already on redirect target page (unauthenticated), preventing redirect loop');
        return;
      }

      console.log('🔀 AUTH_REDIRECT:', `Redirecting to ${redirectTo} due to unauthenticated user`);
      this.router.navigate([redirectTo], {
        replaceUrl: true,
        queryParams: { reason: 'unauthenticated', returnUrl: url }
      }).catch(error => {
        console.error('AuthRoleGuard: Navigation error:', error);
      });
    } else {
      // Default behavior - redirect to login
      const config = this.authService.getConfiguration();
      const loginUrl = config?.redirectLoginUrl || '/login';

      // CRITICAL: Prevent infinite loop by checking current URL
      if (url === loginUrl || url.startsWith(`${loginUrl}?`) || url.startsWith(`${loginUrl}/`)) {
        console.warn('AuthRoleGuard: Already on login page, preventing redirect loop');
        return;
      }

      // Check browser URL to prevent loops
      const browserUrl = this.router.url;
      if (browserUrl === loginUrl || browserUrl.startsWith(`${browserUrl}?`) || browserUrl.startsWith(`${loginUrl}/`)) {
        console.warn('AuthRoleGuard: Browser already on login page, preventing redirect loop');
        return;
      }

      console.log('🔀 LOGIN_REDIRECT:', `Redirecting to ${loginUrl}`);
      this.router.navigate([loginUrl], {
        queryParams: { returnUrl: url },
        replaceUrl: true
      }).catch(error => {
        console.error('AuthRoleGuard: Navigation error:', error);
      });
    }
  }

  private throwUnauthorizedError(message: string): void {
    // Throw an error that can be caught by error handler
    const error = new Error(message);
    error.name = 'UnauthorizedError';
    (error as any).status = 403;
    (error as any).code = 'INSUFFICIENT_PERMISSIONS';

    throw error;
  }
}

/**
 * Helper function to create route with permissions
 * Usage: ...withPermissions(['DEVICE_READ'], { standalone: true })
 */
export function withPermissions(permissions: string | string[], additionalData?: any) {
  return {
    data: { permissions, ...additionalData },
    canActivate: [AuthRoleGuard],
    canActivateChild: [AuthRoleGuard]
  };
}

/**
 * Helper function to create route with permissions and redirect
 * Usage: ...withPermissionsAndRedirect('ADMIN_PANEL', '/unauthorized')
 */
export function withPermissionsAndRedirect(permissions: string | string[], redirectTo: string, additionalData?: any) {
  return {
    data: { permissions, permissionRedirectTo: redirectTo, ...additionalData },
    canActivate: [AuthRoleGuard],
    canActivateChild: [AuthRoleGuard]
  };
}

/**
 * Custom error class for permission errors
 */
export class PermissionError extends Error {
  status = 403;
  code = 'INSUFFICIENT_PERMISSIONS';

  constructor(message: string, public requiredPermissions: string[], public userPermissions: string[]) {
    super(message);
    this.name = 'PermissionError';
  }
}
