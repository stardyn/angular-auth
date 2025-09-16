import {ApiResponse} from "@stardyn/angular-data-source";
import {AuthResponse} from "../models/AuthResponse";
import {XConUser} from "../models/XConUser";

/**
 * Standard API Response Parser
 */
export class StandardAuthResponseParser {

  static parseLoginResponse(response: ApiResponse): AuthResponse {
    return {
      token: response.data.token,
      refresh_token: response.data.refresh_token || null,
      expires_in: response.data.expires_in || 3600,
      token_type: response.data.token_type || 'Bearer',
      user: response.data.user
    };
  }

  static parseRefreshResponse(response: ApiResponse, currentUser: XConUser | null): AuthResponse {
    return {
      token: response.data.token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in || 3600,
      token_type: response.data.token_type || 'Bearer',
      user: currentUser! // Mevcut user bilgilerini koru
    };
  }
}
