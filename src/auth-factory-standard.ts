import {EnvironmentProviders, inject, provideAppInitializer, Provider} from '@angular/core';
import {DataSource, DataSourceApi, StorageService} from '@stardyn/angular-data-source';
import {XconCoreAuthConfig} from "./models/AuthConfig";
import {Router} from "@angular/router";
import {AuthService} from "./services/AuthService";
import {createXconAuthServiceWithConditionalRefresh} from "./auth-factory-base";

/**
 * Provider for AuthService without Refresh Token support
 */
export class ProvideXconAuthStandard {
  static forRoot(config: XconCoreAuthConfig): (Provider | EnvironmentProviders)[] {
    return [
      {
        provide: AuthService,
        useFactory: (
          storageService: StorageService,
          router: Router,
          dataSource: DataSource,
          dataSourceApi: DataSourceApi
        ) => createXconAuthServiceWithConditionalRefresh(
          config,
          storageService,
          router,
          dataSource,
          dataSourceApi,
          undefined, // dataSourceWithRefresh
          undefined, // dataSourceWithRefreshApi
        ),
        deps: [StorageService, Router, DataSource, DataSourceApi]
      },
      provideAppInitializer(() => {
        return inject(AuthService).initialize();
      })
    ];
  }
}

/**
 * Explicit provider function for AuthService without refresh token support
 * @param config Auth configuration
 * @returns Angular Provider and EnvironmentProviders array
 */
export function provideXconAuthStandard(config: XconCoreAuthConfig): (Provider | EnvironmentProviders)[] {
  const standardConfig = {...config, useRefreshToken: false, useTBDataSource: false};
  return ProvideXconAuthStandard.forRoot(standardConfig);
}
