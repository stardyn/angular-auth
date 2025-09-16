// User utility class
import {XConUser, XConUserAuthority} from "./XConUser";

export class XConUserUtils {

  static getFullName(user: XConUser): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.additionalInfo?.full_name) {
      return user.additionalInfo.full_name;
    }
    return user.name || user.email;
  }

  static getDisplayName(user: XConUser): string {
    if (user.additionalInfo?.display_name) {
      return user.additionalInfo.display_name;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.name || user.email;
  }

  static getInitials(user: XConUser): string {
    const fullName = this.getFullName(user);
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Authority checks
  static isAdmin(user: XConUser): boolean {
    return user.authority === XConUserAuthority.ADMIN ||
      user.authority === XConUserAuthority.SYS_ADMIN ||
      user.authority === XConUserAuthority.TENANT_ADMIN;
  }

  static isSysAdmin(user: XConUser): boolean {
    return user.authority === XConUserAuthority.SYS_ADMIN;
  }

  static isTenantAdmin(user: XConUser): boolean {
    return user.authority === XConUserAuthority.TENANT_ADMIN;
  }

  static isCustomerUser(user: XConUser): boolean {
    return user.authority === XConUserAuthority.CUSTOMER_USER;
  }

  static hasAuthority(user: XConUser, authority: XConUserAuthority): boolean {
    return user.authority === authority;
  }

  // Permission checking methods for directive support
  static hasPermission(user: XConUser, permission: string): boolean {
    if (!user || !user.permissions) return false;

    const permissions = user.permissions;
    return permissions.includes(permission);
  }

  static hasAnyPermission(user: XConUser, permissions: string[]): boolean {
    if (!user || !permissions || permissions.length === 0) return false;

    return permissions.some(permission => this.hasPermission(user, permission));
  }

  static hasAllPermissions(user: XConUser, permissions: string[]): boolean {
    if (!user || !permissions || permissions.length === 0) return false;

    return permissions.every(permission => this.hasPermission(user, permission));
  }

  // Status checks
  static isActive(user: XConUser): boolean {
    return user.is_active;
  }

  static isVerified(user: XConUser): boolean {
    return user.is_verified;
  }

  // Dashboard methods
  static getDefaultDashboardId(user: XConUser): string | null {
    return user.additionalInfo?.default_dashboard_id || null;
  }

  // Preferences methods
  static getTheme(user: XConUser): string {
    return user.additionalInfo?.theme || 'light';
  }

  static getLanguage(user: XConUser): string {
    return user.additionalInfo?.lang ||
      user.additionalInfo?.language ||
      'en';
  }

  // Utility methods
  static getAvatar(user: XConUser): string | null {
    return user.additionalInfo?.avatar ||
      user.additionalInfo?.profile_picture ||
      null;
  }

  static getAvatarUrl(user: XConUser, baseUrl?: string): string {
    const avatar = this.getAvatar(user);
    if (avatar) {
      if (avatar.startsWith('http')) {
        return avatar;
      }
      return baseUrl ? `${baseUrl}${avatar}` : avatar;
    }

    // Generate default avatar based on initials
    const initials = this.getInitials(user);
    return `https://ui-avatars.com/api/?name=${initials}&background=random`;
  }
}
