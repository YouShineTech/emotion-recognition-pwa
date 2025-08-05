/**
 * Nginx Web Server Module
 *
 * Manages Nginx configuration for static asset serving, SSL/TLS,
 * load balancing, and security headers
 */

import { promises as fs } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';
import {
  INginxWebServerModule,
  NginxConfig,
  ServerBlock,
  UpstreamConfig,
  SSLConfig,
} from '@/shared/interfaces/nginx-server.interface';

export class NginxWebServerModule extends EventEmitter implements INginxWebServerModule {
  private config: NginxConfig;
  private nginxProcess: ChildProcess | null = null;
  private configPath: string;
  private isRunning = false;

  constructor(config: NginxConfig = {}) {
    super();

    this.config = {
      nginxPath: '/usr/sbin/nginx',
      configDir: '/etc/nginx',
      sitesDir: '/etc/nginx/sites-available',
      enabledDir: '/etc/nginx/sites-enabled',
      logDir: '/var/log/nginx',
      pidFile: '/var/run/nginx.pid',
      user: 'www-data',
      workerProcesses: 'auto',
      workerConnections: 1024,
      keepaliveTimeout: 65,
      clientMaxBodySize: '10M',
      gzipEnabled: true,
      sslProtocols: ['TLSv1.2', 'TLSv1.3'],
      ...config,
    };

    this.configPath = path.join(this.config.configDir, 'nginx.conf');
  }

  /**
   * Initialize Nginx server
   */
  async initialize(): Promise<void> {
    try {
      // Verify Nginx is available
      await this.verifyNginx();

      // Generate main configuration
      await this.generateMainConfig();

      // Generate default server blocks
      await this.generateDefaultServerBlocks();

      this.emit('initialized');
      console.log('NginxWebServerModule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NginxWebServerModule:', error);
      throw error;
    }
  }

  /**
   * Start Nginx server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Nginx is already running');
      return;
    }

    try {
      // Test configuration before starting
      await this.testConfiguration();

      // Start Nginx
      this.nginxProcess = spawn(this.config.nginxPath, ['-c', this.configPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.nginxProcess.stdout?.on('data', data => {
        console.log('Nginx stdout:', data.toString());
      });

      this.nginxProcess.stderr?.on('data', data => {
        console.error('Nginx stderr:', data.toString());
      });

      this.nginxProcess.on('exit', code => {
        console.log(`Nginx process exited with code ${code}`);
        this.isRunning = false;
        this.nginxProcess = null;
        this.emit('stopped', { code });
      });

      this.nginxProcess.on('error', error => {
        console.error('Nginx process error:', error);
        this.emit('error', error);
      });

      // Wait a moment to ensure it started successfully
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.isRunning = true;
      this.emit('started');
      console.log('Nginx server started successfully');
    } catch (error) {
      console.error('Failed to start Nginx:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop Nginx server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.nginxProcess) {
      console.log('Nginx is not running');
      return;
    }

    try {
      // Send graceful shutdown signal
      this.nginxProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise(resolve => {
        this.nginxProcess!.on('exit', resolve);

        // Force kill after 10 seconds
        setTimeout(() => {
          if (this.nginxProcess && !this.nginxProcess.killed) {
            this.nginxProcess.kill('SIGKILL');
          }
          resolve(undefined);
        }, 10000);
      });

      this.isRunning = false;
      this.nginxProcess = null;
      this.emit('stopped');
      console.log('Nginx server stopped successfully');
    } catch (error) {
      console.error('Failed to stop Nginx:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Reload Nginx configuration
   */
  async reload(): Promise<void> {
    try {
      // Test configuration first
      await this.testConfiguration();

      if (this.isRunning && this.nginxProcess) {
        // Send reload signal
        this.nginxProcess.kill('SIGHUP');
        this.emit('reloaded');
        console.log('Nginx configuration reloaded');
      } else {
        console.log('Nginx is not running, cannot reload');
      }
    } catch (error) {
      console.error('Failed to reload Nginx:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add server block configuration
   */
  async addServerBlock(name: string, serverBlock: ServerBlock): Promise<void> {
    try {
      const configContent = this.generateServerBlockConfig(serverBlock);
      const configFile = path.join(this.config.sitesDir, name);

      await fs.writeFile(configFile, configContent);

      // Enable the site
      const enabledFile = path.join(this.config.enabledDir, name);
      await fs.symlink(configFile, enabledFile).catch(() => {}); // Ignore if already exists

      this.emit('serverBlockAdded', { name, serverBlock });
      console.log(`Server block '${name}' added successfully`);
    } catch (error) {
      console.error(`Failed to add server block '${name}':`, error);
      throw error;
    }
  }

  /**
   * Remove server block configuration
   */
  async removeServerBlock(name: string): Promise<void> {
    try {
      const configFile = path.join(this.config.sitesDir, name);
      const enabledFile = path.join(this.config.enabledDir, name);

      // Remove enabled symlink
      await fs.unlink(enabledFile).catch(() => {}); // Ignore if doesn't exist

      // Remove configuration file
      await fs.unlink(configFile).catch(() => {}); // Ignore if doesn't exist

      this.emit('serverBlockRemoved', { name });
      console.log(`Server block '${name}' removed successfully`);
    } catch (error) {
      console.error(`Failed to remove server block '${name}':`, error);
      throw error;
    }
  }

  /**
   * Configure SSL/TLS for a server block
   */
  async configureSSL(serverName: string, sslConfig: SSLConfig): Promise<void> {
    try {
      // Verify certificate files exist
      await fs.access(sslConfig.certificatePath);
      await fs.access(sslConfig.privateKeyPath);

      // Update server block with SSL configuration
      const serverBlock: ServerBlock = {
        listen: [443],
        serverName: [serverName],
        ssl: sslConfig,
        locations: [
          {
            path: '/',
            root: '/var/www/html',
            index: ['index.html', 'index.htm'],
          },
        ],
      };

      await this.addServerBlock(`${serverName}-ssl`, serverBlock);

      this.emit('sslConfigured', { serverName, sslConfig });
      console.log(`SSL configured for ${serverName}`);
    } catch (error) {
      console.error(`Failed to configure SSL for ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Configure upstream servers for load balancing
   */
  async configureUpstream(name: string, upstream: UpstreamConfig): Promise<void> {
    try {
      // Generate upstream configuration
      const upstreamConfig = this.generateUpstreamConfig(name, upstream);

      // Write to upstream configuration file
      const upstreamFile = path.join(this.config.configDir, 'conf.d', `${name}-upstream.conf`);
      await fs.mkdir(path.dirname(upstreamFile), { recursive: true });
      await fs.writeFile(upstreamFile, upstreamConfig);

      this.emit('upstreamConfigured', { name, upstream });
      console.log(`Upstream '${name}' configured successfully`);
    } catch (error) {
      console.error(`Failed to configure upstream '${name}':`, error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      processId: this.nginxProcess?.pid || null,
      configPath: this.configPath,
      version: this.getNginxVersion(),
    };
  }

  /**
   * Test Nginx configuration
   */
  async testConfiguration(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const testProcess = spawn(this.config.nginxPath, ['-t', '-c', this.configPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      testProcess.stderr?.on('data', data => {
        stderr += data.toString();
      });

      testProcess.on('exit', code => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Configuration test failed: ${stderr}`));
        }
      });

      testProcess.on('error', error => {
        reject(new Error(`Configuration test error: ${error.message}`));
      });
    });
  }

  /**
   * Generate main Nginx configuration
   */
  private async generateMainConfig(): Promise<void> {
    const config = `
user ${this.config.user};
worker_processes ${this.config.workerProcesses};
pid ${this.config.pidFile};

events {
    worker_connections ${this.config.workerConnections};
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout ${this.config.keepaliveTimeout};
    types_hash_max_size 2048;
    client_max_body_size ${this.config.clientMaxBodySize};

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;" always;

    # SSL Settings
    ssl_protocols ${this.config.sslProtocols.join(' ')};
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip Settings
    ${
      this.config.gzipEnabled
        ? `
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    `
        : ''
    }

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';

    access_log ${this.config.logDir}/access.log main;
    error_log ${this.config.logDir}/error.log;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Include additional configurations
    include ${this.config.configDir}/conf.d/*.conf;
    include ${this.config.enabledDir}/*;
}
`.trim();

    await fs.writeFile(this.configPath, config);
  }

  /**
   * Generate default server blocks
   */
  private async generateDefaultServerBlocks(): Promise<void> {
    // Default HTTP server block
    const defaultHttp: ServerBlock = {
      listen: [80],
      serverName: ['_'],
      locations: [
        {
          path: '/',
          root: '/var/www/html',
          index: ['index.html', 'index.htm'],
          tryFiles: ['$uri', '$uri/', '=404'],
        },
        {
          path: '/api/',
          proxyPass: 'http://localhost:3001',
          proxySetHeaders: {
            Host: '$host',
            'X-Real-IP': '$remote_addr',
            'X-Forwarded-For': '$proxy_add_x_forwarded_for',
            'X-Forwarded-Proto': '$scheme',
          },
        },
        {
          path: '/ws/',
          proxyPass: 'http://localhost:3001',
          proxyHttpVersion: '1.1',
          proxySetHeaders: {
            Upgrade: '$http_upgrade',
            Connection: 'upgrade',
            Host: '$host',
            'X-Real-IP': '$remote_addr',
            'X-Forwarded-For': '$proxy_add_x_forwarded_for',
            'X-Forwarded-Proto': '$scheme',
          },
        },
      ],
    };

    await this.addServerBlock('default', defaultHttp);
  }

  /**
   * Generate server block configuration
   */
  private generateServerBlockConfig(serverBlock: ServerBlock): string {
    let config = 'server {\n';

    // Listen directives
    for (const port of serverBlock.listen) {
      config += `    listen ${port};\n`;
      if (serverBlock.ssl) {
        config += `    listen ${port} ssl http2;\n`;
      }
    }

    // Server name
    if (serverBlock.serverName) {
      config += `    server_name ${serverBlock.serverName.join(' ')};\n`;
    }

    // SSL configuration
    if (serverBlock.ssl) {
      config += `    ssl_certificate ${serverBlock.ssl.certificatePath};\n`;
      config += `    ssl_certificate_key ${serverBlock.ssl.privateKeyPath};\n`;

      if (serverBlock.ssl.dhParamPath) {
        config += `    ssl_dhparam ${serverBlock.ssl.dhParamPath};\n`;
      }
    }

    // Root and index
    if (serverBlock.root) {
      config += `    root ${serverBlock.root};\n`;
    }
    if (serverBlock.index) {
      config += `    index ${serverBlock.index.join(' ')};\n`;
    }

    // Locations
    if (serverBlock.locations) {
      for (const location of serverBlock.locations) {
        config += `\n    location ${location.path} {\n`;

        if (location.root) {
          config += `        root ${location.root};\n`;
        }
        if (location.index) {
          config += `        index ${location.index.join(' ')};\n`;
        }
        if (location.tryFiles) {
          config += `        try_files ${location.tryFiles.join(' ')};\n`;
        }
        if (location.proxyPass) {
          config += `        proxy_pass ${location.proxyPass};\n`;
        }
        if (location.proxyHttpVersion) {
          config += `        proxy_http_version ${location.proxyHttpVersion};\n`;
        }
        if (location.proxySetHeaders) {
          for (const [header, value] of Object.entries(location.proxySetHeaders)) {
            config += `        proxy_set_header ${header} ${value};\n`;
          }
        }
        if (location.rateLimitZone) {
          config += `        limit_req zone=${location.rateLimitZone};\n`;
        }

        config += '    }\n';
      }
    }

    config += '}\n';
    return config;
  }

  /**
   * Generate upstream configuration
   */
  private generateUpstreamConfig(name: string, upstream: UpstreamConfig): string {
    let config = `upstream ${name} {\n`;

    if (upstream.method) {
      config += `    ${upstream.method};\n`;
    }

    for (const server of upstream.servers) {
      let serverLine = `    server ${server.address}`;
      if (server.weight) serverLine += ` weight=${server.weight}`;
      if (server.maxFails) serverLine += ` max_fails=${server.maxFails}`;
      if (server.failTimeout) serverLine += ` fail_timeout=${server.failTimeout}`;
      if (server.backup) serverLine += ' backup';
      if (server.down) serverLine += ' down';
      serverLine += ';\n';
      config += serverLine;
    }

    config += '}\n';
    return config;
  }

  /**
   * Verify Nginx is available
   */
  private async verifyNginx(): Promise<void> {
    return new Promise((resolve, reject) => {
      const nginx = spawn(this.config.nginxPath, ['-v'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      nginx.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Nginx not found or invalid (exit code: ${code})`));
        }
      });

      nginx.on('error', error => {
        reject(new Error(`Nginx not available: ${error.message}`));
      });
    });
  }

  /**
   * Get Nginx version
   */
  private getNginxVersion(): string {
    // This would typically be extracted from nginx -v output
    return 'unknown';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }

    this.removeAllListeners();
  }
}

export default NginxWebServerModule;
