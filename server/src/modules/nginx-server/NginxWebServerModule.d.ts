/**
 * Nginx Web Server Module
 *
 * Manages Nginx configuration for static asset serving, SSL/TLS,
 * load balancing, and security headers
 */
import { EventEmitter } from 'events';
import { INginxWebServerModule, NginxConfig, ServerBlock, UpstreamConfig, SSLConfig } from '@/shared/interfaces/nginx-server.interface';
export declare class NginxWebServerModule extends EventEmitter implements INginxWebServerModule {
    private config;
    private nginxProcess;
    private configPath;
    private isRunning;
    constructor(config?: NginxConfig);
    /**
     * Initialize Nginx server
     */
    initialize(): Promise<void>;
    /**
     * Start Nginx server
     */
    start(): Promise<void>;
    /**
     * Stop Nginx server
     */
    stop(): Promise<void>;
    /**
     * Reload Nginx configuration
     */
    reload(): Promise<void>;
    /**
     * Add server block configuration
     */
    addServerBlock(name: string, serverBlock: ServerBlock): Promise<void>;
    /**
     * Remove server block configuration
     */
    removeServerBlock(name: string): Promise<void>;
    /**
     * Configure SSL/TLS for a server block
     */
    configureSSL(serverName: string, sslConfig: SSLConfig): Promise<void>;
    /**
     * Configure upstream servers for load balancing
     */
    configureUpstream(name: string, upstream: UpstreamConfig): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): any;
    /**
     * Test Nginx configuration
     */
    testConfiguration(): Promise<boolean>;
    /**
     * Generate main Nginx configuration
     */
    private generateMainConfig;
    /**
     * Generate default server blocks
     */
    private generateDefaultServerBlocks;
    /**
     * Generate server block configuration
     */
    private generateServerBlockConfig;
    /**
     * Generate upstream configuration
     */
    private generateUpstreamConfig;
    /**
     * Verify Nginx is available
     */
    private verifyNginx;
    /**
     * Get Nginx version
     */
    private getNginxVersion;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export default NginxWebServerModule;
//# sourceMappingURL=NginxWebServerModule.d.ts.map