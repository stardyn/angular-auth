import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/AuthService';
import { XConUser } from '../models/XConUser';
import { XConUserUtils } from '../models/XConUserUtils';

/**
 * Structural directive that conditionally includes a template based on user permissions
 *
 * Usage:
 * *xconAuthIfRole="'DEVICE_READ'" - Show if user has DEVICE_READ permission
 * *xconAuthIfRole="'DEVICE_READ | DEVICE_WRITE'" - Show if user has any of the specified permissions (pipe syntax)
 * *xconAuthIfRole="['DEVICE_READ', 'DEVICE_WRITE']" - Show if user has any of the specified permissions (array syntax)
 */
@Directive({
  selector: '[xconAuthIfRole]',
  standalone: true
})
export class XconAuthIfRoleDirective implements OnInit, OnDestroy {
  private hasView = false;
  private subscription: Subscription = new Subscription();
  private _requiredPermissions: string[] = [];

  @Input()
  set xconAuthIfRole(permissions: string | string[]) {
    if (typeof permissions === 'string') {
      // Pipe syntax: "PERM1 | PERM2 | PERM3"
      if (permissions.includes('|')) {
        this._requiredPermissions = permissions
          .split('|')
          .map(p => p.trim())
          .filter(p => p.length > 0); // Empty string'leri filtrele
      } else {
        // Single permission: "PERM1"
        this._requiredPermissions = [permissions.trim()];
      }
    } else {
      // Array syntax: ["PERM1", "PERM2"] (backward compatibility)
      this._requiredPermissions = permissions;
    }
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.subscription.add(
      this.authService.currentUser$.subscribe((user: XConUser | null) => {
        this.updateView();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateView(): void {
    const shouldShow = this.checkUserPermissions();

    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkUserPermissions(): boolean {
    if (!this.authService.getConfiguration().isPermissionEngineActive) {
      return true
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return false;
    }

    // No permissions specified, don't show
    if (!this._requiredPermissions || this._requiredPermissions.length === 0) {
      return false;
    }

    // Use XConUserUtils for permission checking
    return XConUserUtils.hasAnyPermission(currentUser, this._requiredPermissions);
  }
}
