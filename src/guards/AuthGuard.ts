import {Injectable} from '@angular/core';
import {CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {AuthService} from '../services/AuthService';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          // Get login URL from config
          const config = this.authService.getConfiguration();
          const loginUrl = config?.redirectLoginUrl || '/login';

          // CRITICAL: Prevent infinite loop by checking if we're already on login page
          if (url === loginUrl || url.startsWith(`${loginUrl}?`) || url.startsWith(`${loginUrl}/`)) {
            console.warn('AuthGuard: Already on login page, preventing redirect loop');
            return false;
          }

          // CRITICAL: Check if current browser URL is already login to prevent loops
          const currentUrl = this.router.url;
          if (currentUrl === loginUrl || currentUrl.startsWith(`${loginUrl}?`) || currentUrl.startsWith(`${loginUrl}/`)) {
            console.warn('AuthGuard: Browser already on login page, preventing redirect loop');
            return false;
          }

          console.log('AuthGuard: Redirecting unauthenticated user from', url, 'to', loginUrl);

          // Store the attempted URL for after login
          this.router.navigate([loginUrl], {
            queryParams: { returnUrl: url },
            replaceUrl: true
          }).catch(error => {
            console.error('AuthGuard: Navigation error:', error);
          });

          return false;
        }
      })
    );
  }
}
