import {
  DataSource,
  DataSourceApi,
  DataSourceWithRefresh,
  DataSourceWithRefreshApi,
} from '@stardyn/angular-data-source';
import {ModuleConsoleService} from "@stardyn/angular-console";
import {XconCoreAuthConfig} from "../models/AuthConfig";

export class AuthDataSourceManager {
  constructor(
    private dconsole: ModuleConsoleService,
    private dataSource?: DataSource,
    private dataSourceApi?: DataSourceApi,
    private dataSourceWithRefresh?: DataSourceWithRefresh,
    private dataSourceWithRefreshApi?: DataSourceWithRefreshApi,
  ) {
  }

  // Validate dependencies based on configuration
  public validateDependencies(config: XconCoreAuthConfig): void {
    if (config.useRefreshToken) {
      if (!this.dataSourceWithRefresh || !this.dataSourceWithRefreshApi) {
        throw new Error('DataSourceWithRefresh and DataSourceWithRefreshApi must be provided when useRefreshToken is true');
      }
    } else {
      if (!this.dataSource || !this.dataSourceApi) {
        throw new Error('DataSource and DataSourceApi must be provided when useRefreshToken is false');
      }
    }

    this.dconsole.debug('DataSource dependencies validated successfully');
  }

  // Get the appropriate data source based on configuration
  public getDataSource(): DataSource | DataSourceWithRefresh  {

    // Standard DataSource with refresh
    if (this.dataSourceWithRefresh) {
      return this.dataSourceWithRefresh;
    }

    // Standard DataSource
    if (this.dataSource) {
      return this.dataSource;
    }

    throw new Error('No DataSource available');
  }

  public getDataSourceApi(): DataSourceApi | DataSourceWithRefreshApi {
    // Standard DataSource API with refresh
    if (this.dataSourceWithRefreshApi) {
      return this.dataSourceWithRefreshApi;
    }

    // Standard DataSource API
    if (this.dataSourceApi) {
      return this.dataSourceApi;
    }

    throw new Error('No DataSourceApi available');
  }

  // Token management
  public setToken(token: string): void {
    this.dconsole.debug('Setting token in DataSource', {
      tokenPreview: token?.substring(0, 20) + '...',
      tokenLength: token?.length,
      dataSourceType: this.getDataSourceType()
    });

    try {
      const dataSource = this.getDataSource();
      dataSource.tokenSet(token);

      // Verify token was set
      const verifyToken = dataSource.tokenGet();
      const success = verifyToken === token;

      this.dconsole.debug('Token set verification:', {
        success: success,
        tokenMatches: verifyToken === token,
        dataSourceType: this.getDataSourceType(),
        setTokenLength: token?.length,
        getTokenLength: verifyToken?.length
      });

      if (!success) {
        this.dconsole.error('Token was not set correctly!', {
          expectedTokenPreview: token?.substring(0, 20) + '...',
          actualTokenPreview: verifyToken?.substring(0, 20) + '...'
        });

        // Force set token again
        this.dconsole.warn('Attempting to force set token again...');
        dataSource.tokenSet(token);

        const secondVerify = dataSource.tokenGet();
        this.dconsole.debug('Second verification:', {
          success: secondVerify === token,
          tokenLength: secondVerify?.length
        });
      } else {
        this.dconsole.debug('Token set successfully in DataSource');
      }
    } catch (error) {
      this.dconsole.error('Error setting token in DataSource:', error);
      throw error;
    }
  }

  public clearToken(): void {
    try {
      const dataSource = this.getDataSource();
      dataSource.tokenClear();
      this.dconsole.debug('Token cleared from DataSource');
    } catch (error) {
      this.dconsole.warn('Failed to clear token from DataSource:', error);
    }
  }

  // Debug methods
  public getDataSourceType(): string {
    if (this.dataSourceWithRefresh) {
      return 'Standard DataSource with Refresh';
    }
    if (this.dataSource) {
      return 'Standard DataSource';
    }
    return 'No DataSource';
  }
}
