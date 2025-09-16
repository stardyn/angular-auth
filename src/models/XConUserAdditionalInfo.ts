export interface XConUserAdditionalInfo {
  // Profile info
  description?: string;
  avatar?: string;
  profile_picture?: string;

  // Name fields (for TB compatibility)
  display_name?: string;
  full_name?: string;

  // Dashboard preferences
  default_dashboard_id?: string;
  default_dashboard_fullscreen?: boolean;
  home_dashboard_hide_toolbar?: boolean;

  // User preferences
  lang?: string;
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'auto';

  // Security info
  last_login_ip?: string;
  failed_login_attempts?: number;

  // Mobile settings
  mobile_session?: boolean;
  mobile_token?: string;

  // Custom fields - allows any additional data
  [key: string]: any;
}
