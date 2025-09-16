import {ModuleConsoleService} from "@stardyn/angular-console";
import {
  DataSource,
  DataSourceApi,
  DataSourceWithRefresh,
  DataSourceWithRefreshApi,
  StorageService
} from '@stardyn/angular-data-source';
import {XconCoreAuthConfig} from "./models/AuthConfig";
import {Router} from "@angular/router";
import {AuthService} from "./services/AuthService";

/**
 * Base factory function to create AuthService with different DataSource combinations
 */
export function createXconAuthServiceWithConditionalRefresh(
  config: XconCoreAuthConfig,
  storageService: StorageService,
  router: Router,
  // Optional services - one set will be provided based on config
  dataSource?: DataSource,
  dataSourceApi?: DataSourceApi,
  dataSourceWithRefresh?: DataSourceWithRefresh,
  dataSourceWithRefreshApi?: DataSourceWithRefreshApi,
): AuthService {

  // Her AuthService için ayrı ModuleConsoleService instance'ı oluştur
  const moduleConsole = new ModuleConsoleService();

  const consoleConfig = {
    moduleName: 'XconAuth',
    version: require('../package.json').version,
    debugMode: config.debugMode ?? true,
    showTimestamp: true
  };

  moduleConsole.configure(consoleConfig);

  // AuthService'i ModuleConsoleService ile oluştur
  const authService = new AuthService(
    router,
    storageService,
    moduleConsole,
    dataSource,
    dataSourceApi,
    dataSourceWithRefresh,
    dataSourceWithRefreshApi
  );

  // AuthService'i konfigure et - tüm config değerlerini geç
  authService.configure({
    authSiteKey: config.authSiteKey || '',
    authSiteName: config.authSiteName || '',
    debugMode: config.debugMode ?? false,
    useRefreshToken: config.useRefreshToken ?? false,
    passwordHashType: config.passwordHashType,

    // Endpoint konfigürasyonları
    loginEmailEndpoint: config.loginEmailEndpoint,
    loginGmailEndpoint: config.loginGmailEndpoint,
    loginMicrosoftEndpoint: config.loginMicrosoftEndpoint,
    logoutEndpoint: config.logoutEndpoint,
    refreshTokenEndpoint: config.refreshTokenEndpoint
  });

  moduleConsole.logServiceInit(consoleConfig.moduleName, consoleConfig);

  return authService;
}
