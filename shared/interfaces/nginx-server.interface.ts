// Nginx Web Server Module Interface
// Version 1.0

export interface NginxWebServerModule {
  serveStaticAssets(path: string): Promise<StaticAssetResponse>;
  handleHealthCheck(): Promise<HealthCheckResponse>;
  configureCaching(config: CacheConfig): void;
  enableCompression(types: string[]): void;
  configureSSL(certPath: string, keyPath: string): Promise<boolean>;
  setSecurityHeaders(headers: SecurityHeaders): void;
  configureUpstream(servers: UpstreamServer[]): void;
  enableStickySession(enabled: boolean): void;
}

export interface StaticAssetResponse {
  success: boolean;
  contentType: string;
  cacheControl: string;
  etag?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  activeConnections: number;
}

export interface CacheConfig {
  staticAssets: { maxAge: number; etag: boolean };
  apiResponses: { maxAge: number; vary: string[] };
  compression: { enabled: boolean; types: string[] };
}

export interface SecurityHeaders {
  contentSecurityPolicy: string;
  strictTransportSecurity: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
}

export interface UpstreamServer {
  host: string;
  port: number;
  weight: number;
  maxFails: number;
  failTimeout: number;
}
