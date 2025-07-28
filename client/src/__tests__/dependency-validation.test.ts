/**
 * Client-Side Dependency Validation Tests
 *
 * Automated tests to verify modular interface architecture compliance
 * specifically for client-side modules.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Client-Side Dependency Validation', () => {
  const SHARED_INTERFACES_DIR = path.resolve(__dirname, '../../../shared/interfaces');
  const CLIENT_MODULES_DIR = path.resolve(__dirname, '../modules');

  describe('Client Module Import Patterns', () => {
    it('should use @ path alias for interface imports', () => {
      const clientModuleFiles = glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`);

      clientModuleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const interfaceImports = content
            .split('\n')
            .filter(line => line.trim().startsWith('import') && line.includes('shared/interfaces'));

          interfaceImports.forEach(importLine => {
            // Client modules should use @ path alias
            expect(importLine).toMatch(/from\s+['"]@\/shared\/interfaces\/[^'"]+['"]/);
            // Should not use relative paths
            expect(importLine).not.toMatch(/from\s+['"]\.\.\/\.\.\/\.\.\/shared\/interfaces/);
          });
        }
      });
    });

    it('should import only client-relevant interfaces', () => {
      const clientModuleFiles = glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`);

      // Define client-relevant interfaces
      const clientRelevantInterfaces = [
        'common.interface',
        'media-capture.interface',
        'webrtc-transport.interface',
        'overlay-renderer.interface',
        'pwa-shell.interface',
        'overlay-data.interface', // Client may need this for rendering
      ];

      clientModuleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const interfaceImports =
            content.match(/@\/shared\/interfaces\/([^'"]+)\.interface/g) || [];

          interfaceImports.forEach(importPath => {
            const interfaceName = importPath.match(/\/([^/]+)\.interface$/)?.[1];
            if (interfaceName) {
              expect(clientRelevantInterfaces).toContain(`${interfaceName}.interface`);
            }
          });
        }
      });
    });
  });

  describe('Client Module Isolation', () => {
    it('should not import server-specific interfaces', () => {
      const clientModuleFiles = glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`);

      const serverOnlyInterfaces = [
        'frame-extraction.interface',
        'facial-analysis.interface',
        'audio-analysis.interface',
        'media-relay.interface',
        'connection-manager.interface',
        'nginx-server.interface',
      ];

      clientModuleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');

          serverOnlyInterfaces.forEach(serverInterface => {
            expect(content).not.toContain(serverInterface);
          });
        }
      });
    });

    it('should have proper module boundaries between client modules', () => {
      const clientModules = ['media-capture', 'webrtc-transport', 'overlay-renderer', 'pwa-shell'];

      clientModules.forEach(moduleName => {
        const moduleFile = path.join(
          CLIENT_MODULES_DIR,
          moduleName,
          `${moduleName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('')}Module.ts`
        );

        if (fs.existsSync(moduleFile)) {
          const content = fs.readFileSync(moduleFile, 'utf8');

          // Should not directly import other client module implementations
          clientModules.forEach(otherModule => {
            if (otherModule !== moduleName) {
              const otherModuleClass =
                otherModule
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join('') + 'Module';
              expect(content).not.toContain(`import { ${otherModuleClass} }`);
            }
          });
        }
      });
    });
  });

  describe('Browser Environment Compatibility', () => {
    it('should not import Node.js specific modules', () => {
      const clientModuleFiles = glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`);

      const nodeOnlyModules = ['fs', 'path', 'os', 'crypto', 'stream', 'buffer', 'util', 'events'];

      clientModuleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');

          nodeOnlyModules.forEach(nodeModule => {
            // Check for direct imports of Node.js modules
            expect(content).not.toMatch(new RegExp(`from\\s+['"]${nodeModule}['"]`));
            expect(content).not.toMatch(new RegExp(`require\\(['"]${nodeModule}['"]\\)`));
          });
        }
      });
    });

    it('should use browser-compatible APIs in interfaces', () => {
      const clientRelevantInterfaces = [
        'media-capture.interface.ts',
        'webrtc-transport.interface.ts',
        'overlay-renderer.interface.ts',
        'pwa-shell.interface.ts',
      ];

      clientRelevantInterfaces.forEach(interfaceFile => {
        const fullPath = path.join(SHARED_INTERFACES_DIR, interfaceFile);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Should not use Node.js specific types
          expect(content).not.toContain('Buffer');
          expect(content).not.toContain('NodeJS.');

          // Should use standard web APIs
          if (content.includes('MediaStream') || content.includes('RTCPeerConnection')) {
            // These are valid browser APIs
            expect(true).toBe(true);
          }
        }
      });
    });
  });

  describe('PWA Specific Requirements', () => {
    it('should support service worker integration patterns', () => {
      const pwaShellFile = path.join(CLIENT_MODULES_DIR, 'pwa-shell', 'PWAShellModule.ts');

      if (fs.existsSync(pwaShellFile)) {
        const content = fs.readFileSync(pwaShellFile, 'utf8');

        // Should reference service worker concepts
        const serviceWorkerPatterns = [
          /ServiceWorker/i,
          /navigator\.serviceWorker/i,
          /sw\.js/i,
          /offline/i,
          /cache/i,
        ];

        const hasServiceWorkerSupport = serviceWorkerPatterns.some(pattern =>
          pattern.test(content)
        );
        expect(hasServiceWorkerSupport).toBe(true);
      }
    });

    it('should handle offline scenarios in interface definitions', () => {
      const pwaInterface = path.join(SHARED_INTERFACES_DIR, 'pwa-shell.interface.ts');

      if (fs.existsSync(pwaInterface)) {
        const content = fs.readFileSync(pwaInterface, 'utf8');

        // Should define offline handling capabilities
        const offlinePatterns = [/offline/i, /online/i, /connectivity/i, /network/i];

        const hasOfflineSupport = offlinePatterns.some(pattern => pattern.test(content));
        expect(hasOfflineSupport).toBe(true);
      }
    });
  });

  describe('WebRTC Specific Validation', () => {
    it('should properly isolate WebRTC transport concerns', () => {
      const webrtcFile = path.join(
        CLIENT_MODULES_DIR,
        'webrtc-transport',
        'WebRTCTransportModule.ts'
      );

      if (fs.existsSync(webrtcFile)) {
        const content = fs.readFileSync(webrtcFile, 'utf8');

        // Should not handle media capture directly
        expect(content).not.toContain('getUserMedia');
        expect(content).not.toContain('MediaDevices');

        // Should focus on transport concerns
        const transportPatterns = [
          /RTCPeerConnection/i,
          /RTCDataChannel/i,
          /RTCIceCandidate/i,
          /RTCSessionDescription/i,
        ];

        const hasTransportFocus = transportPatterns.some(pattern => pattern.test(content));
        expect(hasTransportFocus).toBe(true);
      }
    });
  });

  describe('Media Capture Isolation', () => {
    it('should isolate media capture from transport concerns', () => {
      const mediaCaptureFile = path.join(
        CLIENT_MODULES_DIR,
        'media-capture',
        'MediaCaptureModule.ts'
      );

      if (fs.existsSync(mediaCaptureFile)) {
        const content = fs.readFileSync(mediaCaptureFile, 'utf8');

        // Should handle media capture
        const capturePatterns = [
          /getUserMedia/i,
          /MediaDevices/i,
          /MediaStream/i,
          /MediaStreamTrack/i,
        ];

        const hasCaptureCapabilities = capturePatterns.some(pattern => pattern.test(content));
        expect(hasCaptureCapabilities).toBe(true);

        // Should not handle WebRTC transport directly
        expect(content).not.toContain('RTCPeerConnection');
        expect(content).not.toContain('RTCDataChannel');
      }
    });
  });
});
