import {Injectable} from '@angular/core';
import {CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {AuthService} from '../services/AuthService';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // User is already authenticated, redirect to dashboard/home
          const config = this.authService.getConfiguration();
          const dashboardUrl = config?.redirectLoginUrl || '/dashboard';

          // CRITICAL: Prevent infinite loop by checking current URL
          const currentUrl = state.url;
          if (currentUrl === dashboardUrl || currentUrl.startsWith(`${dashboardUrl}?`) || currentUrl.startsWith(`${dashboardUrl}/`)) {
            console.warn('LoginGuard: Already on dashboard page, preventing redirect loop');
            return true; // Allow access since user is authenticated
          }

          // CRITICAL: Check browser URL to prevent loops
          const browserUrl = this.router.url;
          if (browserUrl === dashboardUrl || browserUrl.startsWith(`${dashboardUrl}?`) || browserUrl.startsWith(`${dashboardUrl}/`)) {
            console.warn('LoginGuard: Browser already on dashboard page, preventing redirect loop');
            return true;
          }

          console.log('LoginGuard: Redirecting authenticated user from', currentUrl, 'to', dashboardUrl);

          this.router.navigate([dashboardUrl], {
            replaceUrl: true
          }).catch(error => {
            console.error('LoginGuard: Navigation error:', error);
          });

          return false;
        } else {
          // User is not authenticated, allow access to login page
          return true;
        }
      })
    );
  }
}
