# @stardyn/angular-auth

Lightweight, configurable authentication service for Angular applications with token management, role-based access control, and comprehensive security features.

## Features

- **Token Management**: JWT token handling with automatic refresh support
- **Role-Based Access Control**: Route guards and directives for permission-based access
- **Social Authentication**: Google and Microsoft OAuth integration
- **Multiple DataSource Support**: Compatible with standard and refresh-enabled data sources
- **Route Guards**: Comprehensive guard system for authentication and authorization
- **TypeScript Support**: Full type safety with detailed interfaces
- **Security Features**: Password hashing, secure token storage, and automatic logout
- **Angular Integration**: Seamless integration with Angular Router and Dependency Injection

## Installation

```bash
npm install @stardyn/angular-auth
```

## Prerequisites

This package requires the following peer dependencies:

```bash
npm install @stardyn/angular-console @stardyn/angular-data-source @stardyn/angular-helpers
```

## Quick Start

### 1. Basic Authentication Setup

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { provideXconAuth } from '@stardyn/angular-auth';
import { XconPasswordHashType } from '@stardyn/angular-auth';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot([])
  ],
  providers: [
    provideXconAuth({
      useRefreshToken: true,
      debugMode: true,
      passwordHashType: XconPasswordHashType.SHA256,
      loginEmailEndpoint: '/api/auth/login',
      logoutEndpoint: '/api/auth/logout',
      refreshTokenEndpoint: '/api/auth/refresh'
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. Standalone Application Setup

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideXconAuth, XconPasswordHashType } from '@stardyn/angular-auth';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideXconAuth({
      useRefreshToken: false,
      debugMode: false,
      passwordHashType: XconPasswordHashType.MD5_UPPER,
      loginEmailEndpoint: '/auth/login-by-email',
      redirectLoginUrl: '/dashboard'
    })
  ]
});
```

### 3. Authentication Service Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService, LoginRequest } from '@stardyn/angular-auth';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="login()">
      <input [(ngModel)]="email" type="email" placeholder="Email" required>
      <input [(ngModel)]="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        console.log('User is authenticated');
      }
    });
  }

  login() {
    const credentials: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response.user);
        // Redirect will be handled automatically
      },
      error: (error) => {
        console.error('Login failed:', error.message);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
```

## Route Guards

### Authentication Guard

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from '@stardyn/angular-auth';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard]
  }
];
```

### Role-Based Guard

```typescript
import { Routes } from '@angular/router';
import { AuthRoleGuard, withPermissions, withPermissionsAndRedirect } from '@stardyn/angular-auth';

export const routes: Routes = [
  {
    path: 'devices',
    component: DevicesComponent,
    canActivate: [AuthRoleGuard],
    data: { permissions: 'DEVICE_READ' }
  },
  {
    path: 'admin-panel',
    component: AdminPanelComponent,
    canActivate: [AuthRoleGuard],
    data: { 
      permissions: 'ADMIN_PANEL | SUPER_ADMIN',
      permissionRedirectTo: '/unauthorized'
    }
  },
  // Using helper functions
  {
    path: 'settings',
    component: SettingsComponent,
    ...withPermissions(['SETTINGS_READ', 'SETTINGS_WRITE'])
  },
  {
    path: 'reports',
    component: ReportsComponent,
    ...withPermissionsAndRedirect('REPORTS_READ', '/access-denied')
  }
];
```

### Login Guard

```typescript
import { Routes } from '@angular/router';
import { LoginGuard } from '@stardyn/angular-auth';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard] // Redirects authenticated users away from login page
  }
];
```

## Permission Directive

Use the structural directive to conditionally show content based on user permissions:

```typescript
import { Component } from '@angular/core';
import { XconAuthIfRoleDirective } from '@stardyn/angular-auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [XconAuthIfRoleDirective],
  template: `
    <!-- Single permission -->
    <button *xconAuthIfRole="'DEVICE_CREATE'">Create Device</button>
    
    <!-- Multiple permissions (any) -->
    <div *xconAuthIfRole="'ADMIN_PANEL | SUPER_ADMIN'">
      <h3>Admin Tools</h3>
    </div>
    
    <!-- Array syntax -->
    <section *xconAuthIfRole="['REPORTS_READ', 'REPORTS_WRITE']">
      <app-reports></app-reports>
    </section>
  `
})
export class DashboardComponent {}
```

## Social Authentication

```typescript
import { Component } from '@angular/core';
import { AuthService, LoginMicrosoftRequest } from '@stardyn/angular-auth';

@Component({
  selector: 'app-social-login',
  template: `
    <button (click)="loginWithGoogle()">Login with Google</button>
    <button (click)="loginWithMicrosoft()">Login with Microsoft</button>
  `
})
export class SocialLoginComponent {
  constructor(private authService: AuthService) {}

  loginWithGoogle() {
    this.authService.loginWithGoogle().subscribe({
      next: (response) => console.log('Google login successful'),
      error: (error) => console.error('Google login failed:', error)
    });
  }

  loginWithMicrosoft() {
    const microsoftData: LoginMicrosoftRequest = {
      email: 'user@company.com',
      displayName: 'John Doe',
      token: 'microsoft-oauth-token'
    };

    this.authService.loginWithMicrosoft(microsoftData).subscribe({
      next: (response) => console.log('Microsoft login successful'),
      error: (error) => console.error('Microsoft login failed:', error)
    });
  }
}
```

## Configuration Options

### Core Configuration

```typescript
interface XconCoreAuthConfig {
  // Security settings
  authSiteKey?: string;
  authSiteName?: string;
  passwordHashType?: XconPasswordHashType;
  debugMode?: boolean;
  
  // Token management
  useRefreshToken?: boolean;
  
  // API endpoints
  loginEmailEndpoint?: string;
  loginGmailEndpoint?: string;
  loginMicrosoftEndpoint?: string;
  logoutEndpoint?: string;
  refreshTokenEndpoint?: string;
  
  // Redirect URLs
  redirectLoginUrl?: string;    // Where to go after login (default: '/dashboard')
  redirectLogoutUrl?: string;   // Where to go after logout (default: '/login')
  
  // Permission system
  isPermissionEngineActive?: boolean;
}
```

### Password Hash Types

```typescript
enum XconPasswordHashType {
  NONE = 'NONE',           // No hashing (not recommended)
  MD5_UPPER = 'MD5_UPPER', // MD5 hash uppercase
  SHA256 = 'SHA256'        // SHA256 with site key
}
```

## Advanced Usage

### Custom Token Refresh

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService } from '@stardyn/angular-auth';

@Component({
  selector: 'app-advanced-auth'
})
export class AdvancedAuthComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Manual token refresh
    this.authService.refreshToken().then(response => {
      if (response.success) {
        console.log('Token refreshed successfully');
      }
    });
  }

  getCurrentUserInfo() {
    const user = this.authService.getCurrentUser();
    if (user) {
      console.log('Current user:', {
        id: user.user_id,
        email: user.email,
        permissions: user.permissions,
        company: user.company_name
      });
    }
  }
}
```

### User Utilities

```typescript
import { XConUserUtils, XConUser } from '@stardyn/angular-auth';

// User information helpers
const user: XConUser = getCurrentUser();

const fullName = XConUserUtils.getFullName(user);
const displayName = XConUserUtils.getDisplayName(user);
const initials = XConUserUtils.getInitials(user);
const avatarUrl = XConUserUtils.getAvatarUrl(user, 'https://cdn.example.com');

// Permission checks
const canRead = XConUserUtils.hasPermission(user, 'DEVICE_READ');
const canDoAny = XConUserUtils.hasAnyPermission(user, ['READ', 'WRITE']);
const canDoAll = XConUserUtils.hasAllPermissions(user, ['READ', 'WRITE']);

// Authority checks
const isAdmin = XConUserUtils.isAdmin(user);
const isSysAdmin = XConUserUtils.isSysAdmin(user);
const isCustomerUser = XConUserUtils.isCustomerUser(user);
```

## Error Handling

```typescript
import { Component } from '@angular/core';
import { AuthService } from '@stardyn/angular-auth';

@Component({
  selector: 'app-error-handling'
})
export class ErrorHandlingComponent {
  constructor(private authService: AuthService) {}

  handleLogin() {
    this.authService.login({ email: 'user@test.com', password: 'test' })
      .subscribe({
        next: (response) => {
          // Success
        },
        error: (error) => {
          switch (error.message) {
            case 'Invalid credentials':
              console.log('Wrong email or password');
              break;
            case 'Network connection failed':
              console.log('Check your internet connection');
              break;
            case 'Access forbidden':
              console.log('Account may be suspended');
              break;
            default:
              console.log('Login failed:', error.message);
          }
        }
      });
  }
}
```

## Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  auth: {
    useRefreshToken: true,
    debugMode: true,
    passwordHashType: 'SHA256',
    loginEmailEndpoint: '/dev/auth/login',
    redirectLoginUrl: '/dashboard',
    authSiteKey: 'dev-site-key',
    authSiteName: 'MyApp Development'
  }
};

// app.module.ts
import { environment } from '../environments/environment';

@NgModule({
  providers: [
    provideXconAuth(environment.auth)
  ]
})
export class AppModule {}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { 
  AuthService, 
  XConUser, 
  AuthResponse, 
  XconCoreAuthConfig,
  LoginRequest,
  RefreshTokenRequest 
} from '@stardyn/angular-auth';

// Type-safe configuration
const config: XconCoreAuthConfig = {
  useRefreshToken: true,
  debugMode: false,
  passwordHashType: XconPasswordHashType.SHA256
};

// Type-safe user handling
const handleUser = (user: XConUser) => {
  console.log(`User ${user.name} has permissions:`, user.permissions);
};
```

## Dependencies

### Peer Dependencies

- `@angular/core` ^20.0.0
- `@angular/common` ^20.0.0
- `@angular/router` ^20.0.0
- `rxjs` >=7.0.0
- `@stardyn/angular-console` ^2.0.9
- `@stardyn/angular-data-source` ^2.0.9
- `@stardyn/angular-helpers` ^2.0.9

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details.

## Repository

https://github.com/stardyn/angular-auth