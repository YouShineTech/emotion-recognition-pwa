/**
 * Nginx Web Server Module Interfaces
 */

export interface INginxWebServerModule {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  reload(): Promise<void>;
  addServerBlock(name: string, serverBlock: ServerBlock): Promise<void>;
  removeServerBlock(name: string): Promise<void>;
  configureSSL(serverName: string, sslConfig: SSLConfig): Promise<void>;
  configureUpstream(name: string, upstream: UpstreamConfig): Promise<void>;
  getStatus(): any;
  testConfiguration(): Promise<boolean>;
  cleanup(): Promise<void>;
}

export interface NginxConfig {
  nginxPath?: string;
  configDir?: string;
  sitesDir?: string;
  enabledDir?: string;
  logDir?: string;
  pidFile?: string;
  user?: string;
  workerProcesses?: string | number;
  workerConnections?: number;
  keepaliveTimeout?: number;
  clientMaxBodySize?: string;
  gzipEnabled?: boolean;
  sslProtocols?: string[];
}

export interface ServerBlock {
  listen: number[];
  serverName?: string[];
  root?: string;
  index?: string[];
  ssl?: SSLConfig;
  locations?: LocationBlock[];
}

export interface LocationBlock {
  path: string;
  root?: string;
  index?: string[];
  tryFiles?: string[];
  proxyPass?: string;
  proxyHttpVersion?: string;
  proxySetHeaders?: { [key: string]: string };
  rateLimitZone?: string;
}

export interface SSLConfig {
  certificatePath: string;
  privateKeyPath: string;
  dhParamPath?: string;
  protocols?: string[];
  ciphers?: string;
}

export interface UpstreamConfig {
  servers: UpstreamServer[];
  method?: 'round_robin' | 'least_conn' | 'ip_hash' | 'hash';
}

export interface UpstreamServer {
  address: string;
  weight?: number;
  maxFails?: number;
  failTimeout?: string;
  backup?: boolean;
  down?: boolean;
}
