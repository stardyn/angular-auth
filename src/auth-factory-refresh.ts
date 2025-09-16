import {EnvironmentProviders, inject, provideAppInitializer, Provider} from '@angular/core';
import {DataSourceWithRefresh, DataSourceWithRefreshApi, StorageService} from '@stardyn/angular-data-source';
import {XconCoreAuthConfig} from "./models/AuthConfig";
import {Router} from "@angular/router";
import {AuthService} from "./services/AuthService";
import {createXconAuthServiceWithConditionalRefresh} from "./auth-factory-base";

/**
 * Provider for AuthService with Refresh Token support
 */
export class ProvideXconAuthWithRefresh {
  static forRoot(config: XconCoreAuthConfig): (Provider | EnvironmentProviders)[] {
    return [
      {
        provide: AuthService,
        useFactory: (
          storageService: StorageService,
          router: Router,
          dataSourceWithRefresh: DataSourceWithRefresh,
          dataSourceWithRefreshApi: DataSourceWithRefreshApi
        ) => createXconAuthServiceWithConditionalRefresh(
          config,
          storageService,
          router,
          undefined, // dataSource
          undefined, // dataSourceApi
          dataSourceWithRefresh,
          dataSourceWithRefreshApi,
        ),
        deps: [StorageService, Router, DataSourceWithRefresh, DataSourceWithRefreshApi]
      },
      provideAppInitializer(() => {
        return inject(AuthService).initialize();
      })
    ];
  }
}

/**
 * Explicit provider function for AuthService with refresh token support
 * @param config Auth configuration
 * @returns Angular Provider and EnvironmentProviders array
 */
export function provideXconAuthWithRefresh(config: XconCoreAuthConfig): (Provider | EnvironmentProviders)[] {
  const refreshConfig = {...config, useRefreshToken: true, useTBDataSource: false};
  return ProvideXconAuthWithRefresh.forRoot(refreshConfig);
}
