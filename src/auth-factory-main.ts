import {EnvironmentProviders, Provider} from '@angular/core';
import {XconCoreAuthConfig} from "./models/AuthConfig";
import {ProvideXconAuthStandard, provideXconAuthStandard} from "./auth-factory-standard";
import {ProvideXconAuthWithRefresh, provideXconAuthWithRefresh} from "./auth-factory-refresh";

/**
 * Smart provider function that automatically chooses the correct DataSource based on config
 * @param config Auth configuration
 * @returns Angular Provider and EnvironmentProviders array
 */
export function provideXconAuth(config: XconCoreAuthConfig): (Provider | EnvironmentProviders)[] {
 if (config.useRefreshToken) {
    return ProvideXconAuthWithRefresh.forRoot(config);
  } else {
    return ProvideXconAuthStandard.forRoot(config);
  }
}

// Re-export specific provider functions
export {
  provideXconAuthStandard,
  provideXconAuthWithRefresh,
};
