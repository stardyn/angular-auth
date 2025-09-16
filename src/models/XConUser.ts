import {XConUserAdditionalInfo} from "./XConUserAdditionalInfo";

export interface XConUser {
  // Standard user fields
  id?: number;
  user_id: string;
  user_type: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: number;
  company_id: string;
  company_name: string;

  createdTime?: number;
  tenantId?: string;
  customerId?: string;
  authority?: XConUserAuthority;
  firstName?: string;
  lastName?: string;
  customMenuId?: string;
  version?: number;
  permissions: string[];

  additionalInfo?: XConUserAdditionalInfo;

  settings?: XConUserSettings;

  ownerId?: string;
}

export enum XConUserAuthority {
  // Standard authorities
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',

  // TB authorities
  SYS_ADMIN = 'SYS_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  CUSTOMER_USER = 'CUSTOMER_USER'
}


export interface XConUserSettings {
  // Notification settings
  email_notifications?: boolean;
  sms_notifications?: boolean;

  // Custom settings - allows any additional preferences
  [key: string]: any;
}


