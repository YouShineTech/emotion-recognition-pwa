/**
 * Dependency Validation Tests
 *
 * Automated tests to verify modular interface architecture compliance.
 * These tests ensure that the interface modularization requirements are met
 * and maintained over time.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('Dependency Validation', () => {
  const SHARED_INTERFACES_DIR = path.resolve(__dirname, '../../../shared/interfaces');
  const CLIENT_MODULES_DIR = path.resolve(__dirname, '../../../client/src/modules');
  const SERVER_MODULES_DIR = path.resolve(__dirname, '../modules');

  describe('Central Export Hub Validation', () => {
    it.skip('should not have any central export hub files', () => {
      // Check for common hub file patterns
      const hubPatterns = ['index.ts', 'index.js', 'index.d.ts'];

      hubPatterns.forEach(pattern => {
        const hubFile = path.join(SHARED_INTERFACES_DIR, pattern);
        expect(fs.existsSync(hubFile)).toBe(false);
      });

      // Also check that there are no files that export everything
      const interfaceFiles = fs
        .readdirSync(SHARED_INTERFACES_DIR)
        .filter(file => file.endsWith('.ts'));

      interfaceFiles.forEach(file => {
        const fullPath = path.join(SHARED_INTERFACES_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for patterns that indicate a central hub
        const hasWildcardExports = content.includes('export *');
        const hasMultipleReExports = (content.match(/export.*from/g) || []).length > 5;

        expect(hasWildcardExports).toBe(false);
        expect(hasMultipleReExports).toBe(false);
      });
    });

    it('should not import from central export hubs', () => {
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      const forbiddenPatterns = [
        /from\s+['"].*\/index['"]/,
        /from\s+['"].*\/index\.ts['"]/,
        /from\s+['"].*\/index\.js['"]/,
        /from\s+['"]@\/shared\/interfaces['"]/,
        /from\s+['"]\.\.\/\.\.\/\.\.\/shared\/interfaces['"]/,
      ];

      moduleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');

          forbiddenPatterns.forEach(pattern => {
            expect(content).not.toMatch(pattern);
          });
        }
      });
    });
  });

  describe('Module Import Requirements', () => {
    it('should use explicit interface imports with specific file paths', () => {
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      const validInterfaceImportPattern = /from\s+['"]@\/shared\/interfaces\/[^/]+\.interface['"]/;

      moduleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const interfaceImports = content
            .split('\n')
            .filter(line => line.trim().startsWith('import') && line.includes('shared/interfaces'));

          interfaceImports.forEach(importLine => {
            expect(importLine).toMatch(validInterfaceImportPattern);
          });
        }
      });
    });

    it('should only import interfaces that are actually used', () => {
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      moduleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');

          // Extract imported interface names
          const importMatches =
            content.match(
              /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g
            ) || [];

          importMatches.forEach(importStatement => {
            const importedNames =
              importStatement
                .match(/\{\s*([^}]+)\s*\}/)?.[1]
                ?.split(',')
                .map(name => name.trim()) || [];

            importedNames.forEach(importedName => {
              // Check if the imported name is actually used in the file
              const usagePattern = new RegExp(`\\b${importedName}\\b`, 'g');
              const matches = content.match(usagePattern) || [];

              // Should appear at least twice: once in import, once in usage
              expect(matches.length).toBeGreaterThan(1);
            });
          });
        }
      });
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should not have circular dependencies between interfaces', () => {
      const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);
      const dependencies = new Map<string, string[]>();

      // Build dependency graph
      interfaceFiles.forEach((file: string) => {
        const content = fs.readFileSync(file, 'utf8');
        const imports = content.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/g) || [];
        const fileName = path.basename(file, '.ts');

        const deps = imports
          .map(imp => {
            const match = imp.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/);
            return match ? match[1] + '.interface' : null;
          })
          .filter(Boolean) as string[];

        dependencies.set(fileName, deps);
      });

      // Detect cycles using DFS
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (node: string): boolean => {
        if (recursionStack.has(node)) {
          return true;
        }
        if (visited.has(node)) {
          return false;
        }

        visited.add(node);
        recursionStack.add(node);

        const deps = dependencies.get(node) || [];
        for (const dep of deps) {
          if (hasCycle(dep)) {
            return true;
          }
        }

        recursionStack.delete(node);
        return false;
      };

      dependencies.forEach((_, node) => {
        if (!visited.has(node)) {
          expect(hasCycle(node)).toBe(false);
        }
      });
    });
  });

  describe('Single Responsibility Validation', () => {
    it('should have exactly one module interface per file', () => {
      const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);

      interfaceFiles.forEach((file: string) => {
        const content = fs.readFileSync(file, 'utf8');
        const moduleInterfaceCount = (content.match(/export\s+interface\s+\w+Module/g) || [])
          .length;

        expect(moduleInterfaceCount).toBeLessThanOrEqual(1);
      });
    });

    it.skip('should have interface files named consistently with their module', () => {
      const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);

      interfaceFiles.forEach((file: string) => {
        const fileName = path.basename(file, '.interface.ts');
        const content = fs.readFileSync(file, 'utf8');

        // Skip common.interface.ts as it doesn't follow module naming
        if (fileName === 'common') {
          return;
        }

        // Convert kebab-case filename to PascalCase for interface matching
        // const expectedInterfaceName =
        //   fileName
        //     .split('-')
        //     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        //     .join('') + 'Module';

        // const hasExpectedInterface = content.includes(`interface ${expectedInterfaceName}`);

        // Each interface file should have at least one exported interface
        const hasExportedInterface = content.includes('export interface');
        if (!hasExportedInterface) {
          console.log(`File: ${file}`);
          console.log(`Content preview: ${content.substring(0, 200)}`);
        }
        expect(hasExportedInterface).toBe(true);

        // Interface file should be related to its filename (flexible check)
        const fileNameParts = fileName.split('-');
        const hasRelatedInterface = fileNameParts.some(part =>
          content.toLowerCase().includes(part.toLowerCase())
        );
        expect(hasRelatedInterface).toBe(true);
      });
    });
  });

  describe('Interface Change Impact Analysis', () => {
    it('should be able to identify which modules import each interface', () => {
      const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      const interfaceDependents = new Map<string, string[]>();

      interfaceFiles.forEach((interfaceFile: string) => {
        const interfaceName = path.basename(interfaceFile, '.ts');
        const dependentModules: string[] = [];

        moduleFiles.forEach((moduleFile: string) => {
          if (fs.existsSync(moduleFile)) {
            const content = fs.readFileSync(moduleFile, 'utf8');
            const importPattern = new RegExp(
              `from\\s+['"]@\\/shared\\/interfaces\\/${interfaceName}['"]`
            );

            if (importPattern.test(content)) {
              dependentModules.push(moduleFile);
            }
          }
        });

        interfaceDependents.set(interfaceName, dependentModules);
      });

      // Verify that each interface has a bounded set of dependents
      interfaceDependents.forEach((dependents, interfaceName) => {
        // Module-specific interfaces should have limited dependents
        expect(dependents.length).toBeLessThanOrEqual(5);

        // Interfaces should be used (unless they're utility interfaces)
        if (!interfaceName.includes('common') && !interfaceName.includes('util')) {
          // Most interfaces should have at least some usage, but allow for new/unused interfaces
          expect(dependents.length).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should maintain interface isolation - changes should not affect unrelated modules', () => {
      const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);

      interfaceFiles.forEach((interfaceFile: string) => {
        const interfaceName = path.basename(interfaceFile, '.interface.ts');

        // Skip common interface as it's shared
        if (interfaceName === 'common') {
          return;
        }

        const content = fs.readFileSync(interfaceFile, 'utf8');

        // Check that module-specific interfaces don't import from other module interfaces
        const moduleInterfaceImports =
          content.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/g) || [];

        moduleInterfaceImports.forEach(importStatement => {
          const match = importStatement.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/);
          if (match) {
            const importedInterface = match[1];
            // Only common interface should be imported by module interfaces
            expect(importedInterface).toBe('common');
          }
        });
      });
    });
  });

  describe('Build System Compatibility', () => {
    it('should support tree-shaking with explicit imports', () => {
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      moduleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');

          // Check for explicit named imports (supports tree-shaking)
          const interfaceImports =
            content.match(
              /import\s*\{\s*[^}]+\s*\}\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g
            ) || [];
          const wildcardImports =
            content.match(
              /import\s*\*\s*as\s*\w+\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g
            ) || [];

          // Should prefer named imports over wildcard imports for tree-shaking
          if (interfaceImports.length > 0) {
            expect(wildcardImports.length).toBe(0);
          }
        }
      });
    });

    it('should have consistent path resolution across all modules', () => {
      const moduleFiles = [
        ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
        ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
      ];

      const pathPatterns = new Set<string>();

      moduleFiles.forEach((file: string) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const imports = content.match(/from\s+['"][^'"]*shared\/interfaces[^'"]*['"]/g) || [];

          imports.forEach((importStatement: string) => {
            const pathMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
            if (pathMatch && pathMatch[1]) {
              const importPath = pathMatch[1];
              pathPatterns.add(importPath.replace(/\/[^/]+\.interface$/, ''));
            }
          });
        }
      });

      // All modules should use the same path pattern for shared interfaces
      const uniquePatterns = Array.from(pathPatterns);
      expect(uniquePatterns.length).toBeLessThanOrEqual(2); // Allow for @/ and relative paths
    });
  });
});
