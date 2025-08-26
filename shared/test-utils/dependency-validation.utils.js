"use strict";
/**
 * Shared Dependency Validation Utilities
 *
 * Common utilities for validating modular interface architecture
 * across client and server test suites.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterfaceDependencyGraph = buildInterfaceDependencyGraph;
exports.detectCircularDependencies = detectCircularDependencies;
exports.analyzeModuleImports = analyzeModuleImports;
exports.validateNoCentralHubs = validateNoCentralHubs;
exports.validateSingleResponsibility = validateSingleResponsibility;
exports.validateExplicitImports = validateExplicitImports;
exports.calculateInterfaceImpact = calculateInterfaceImpact;
exports.validateTreeShakingCompatibility = validateTreeShakingCompatibility;
exports.generateValidationReport = generateValidationReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Build a dependency graph from interface files
 */
function buildInterfaceDependencyGraph(interfacesDir) {
    const interfaceFiles = fs_1.default
        .readdirSync(interfacesDir)
        .filter(file => file.endsWith('.interface.ts'));
    const dependencies = {};
    interfaceFiles.forEach((file) => {
        const fullPath = path_1.default.join(interfacesDir, file);
        const content = fs_1.default.readFileSync(fullPath, 'utf8');
        const imports = content.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/g) || [];
        const fileName = path_1.default.basename(file, '.ts');
        const deps = imports
            .map(imp => {
            const match = imp.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/);
            return match ? match[1] + '.interface' : null;
        })
            .filter(Boolean);
        dependencies[fileName] = deps;
    });
    return dependencies;
}
/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(dependencies) {
    const errors = [];
    const visited = new Set();
    const recursionStack = new Set();
    const hasCycle = (node, path = []) => {
        if (recursionStack.has(node)) {
            errors.push(`Circular dependency detected: ${[...path, node].join(' -> ')}`);
            return true;
        }
        if (visited.has(node)) {
            return false;
        }
        visited.add(node);
        recursionStack.add(node);
        const deps = dependencies[node] || [];
        for (const dep of deps) {
            if (hasCycle(dep, [...path, node])) {
                return true;
            }
        }
        recursionStack.delete(node);
        return false;
    };
    let hasAnyCycle = false;
    Object.keys(dependencies).forEach(node => {
        if (!visited.has(node)) {
            if (hasCycle(node)) {
                hasAnyCycle = true;
            }
        }
    });
    return {
        isValid: !hasAnyCycle,
        errors,
        warnings: [],
    };
}
/**
 * Analyze module imports to ensure they only import what they use
 */
function analyzeModuleImports(moduleFiles) {
    return moduleFiles.map(file => {
        if (!fs_1.default.existsSync(file)) {
            return { file, imports: [], usedTypes: [] };
        }
        const content = fs_1.default.readFileSync(file, 'utf8');
        // Extract imported interface names
        const importMatches = content.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g) ||
            [];
        const imports = [];
        importMatches.forEach(importStatement => {
            const importedNames = importStatement
                .match(/\{\s*([^}]+)\s*\}/)?.[1]
                ?.split(',')
                .map(name => name.trim()) || [];
            imports.push(...importedNames);
        });
        // Find which types are actually used (simple heuristic)
        const usedTypes = imports.filter(importedName => {
            const usagePattern = new RegExp(`\\b${importedName}\\b`, 'g');
            const matches = content.match(usagePattern) || [];
            // Should appear more than once (import + usage)
            return matches.length > 1;
        });
        return { file, imports, usedTypes };
    });
}
/**
 * Validate that no central export hubs exist
 */
function validateNoCentralHubs(interfacesDir) {
    const errors = [];
    const forbiddenHubFiles = [
        path_1.default.join(interfacesDir, 'index.ts'),
        path_1.default.join(interfacesDir, 'index.js'),
        path_1.default.join(interfacesDir, 'index.d.ts'),
    ];
    forbiddenHubFiles.forEach(hubFile => {
        if (fs_1.default.existsSync(hubFile)) {
            errors.push(`Central export hub detected: ${hubFile}`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings: [],
    };
}
/**
 * Validate single responsibility principle for interface files
 */
function validateSingleResponsibility(interfacesDir) {
    const errors = [];
    const warnings = [];
    const interfaceFiles = fs_1.default
        .readdirSync(interfacesDir)
        .filter(file => file.endsWith('.interface.ts'));
    interfaceFiles.forEach((file) => {
        const fullPath = path_1.default.join(interfacesDir, file);
        const content = fs_1.default.readFileSync(fullPath, 'utf8');
        const moduleInterfaceCount = (content.match(/export\s+interface\s+\w+Module/g) || []).length;
        if (moduleInterfaceCount > 1) {
            errors.push(`${fullPath} contains ${moduleInterfaceCount} module interfaces. Each file should serve exactly one module.`);
        }
        // Check for consistent naming
        const fileName = path_1.default.basename(file, '.interface.ts');
        if (fileName !== 'common') {
            const expectedInterfaceName = fileName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('') + 'Module';
            const hasExpectedInterface = content.includes(`interface ${expectedInterfaceName}`);
            if (!hasExpectedInterface) {
                warnings.push(`${fullPath} should contain interface ${expectedInterfaceName} based on filename`);
            }
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Validate that modules use explicit import paths
 */
function validateExplicitImports(moduleFiles) {
    const errors = [];
    const warnings = [];
    const forbiddenPatterns = [
        { pattern: /from\s+['"].*\/index['"]/, message: 'Index imports are not allowed' },
        { pattern: /from\s+['"].*\/index\.ts['"]/, message: 'Index.ts imports are not allowed' },
        { pattern: /from\s+['"].*\/index\.js['"]/, message: 'Index.js imports are not allowed' },
        {
            pattern: /from\s+['"]@\/shared\/interfaces['"]/,
            message: 'Directory imports are not allowed',
        },
    ];
    const requiredPattern = /from\s+['"]@\/shared\/interfaces\/[^/]+\.interface['"]/;
    moduleFiles.forEach((file) => {
        if (!fs_1.default.existsSync(file))
            return;
        const content = fs_1.default.readFileSync(file, 'utf8');
        // Check for forbidden patterns
        forbiddenPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(content)) {
                errors.push(`${file}: ${message}`);
            }
        });
        // Check for proper interface imports
        const interfaceImports = content
            .split('\n')
            .filter(line => line.trim().startsWith('import') && line.includes('shared/interfaces'));
        interfaceImports.forEach(importLine => {
            if (!requiredPattern.test(importLine)) {
                warnings.push(`${file}: Interface import should use specific .interface file: ${importLine.trim()}`);
            }
        });
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Calculate interface impact - which modules would be affected by interface changes
 */
function calculateInterfaceImpact(interfacesDir, moduleFiles) {
    const interfaceFiles = fs_1.default
        .readdirSync(interfacesDir)
        .filter(file => file.endsWith('.interface.ts'));
    const impactMap = new Map();
    interfaceFiles.forEach((interfaceFile) => {
        const interfaceName = path_1.default.basename(interfaceFile, '.ts');
        const affectedModules = [];
        moduleFiles.forEach((moduleFile) => {
            if (fs_1.default.existsSync(moduleFile)) {
                const content = fs_1.default.readFileSync(moduleFile, 'utf8');
                const importPattern = new RegExp(`from\\s+['"]@\\/shared\\/interfaces\\/${interfaceName}['"]`);
                if (importPattern.test(content)) {
                    affectedModules.push(moduleFile);
                }
            }
        });
        impactMap.set(interfaceName, affectedModules);
    });
    return impactMap;
}
/**
 * Validate tree-shaking compatibility
 */
function validateTreeShakingCompatibility(moduleFiles) {
    const errors = [];
    const warnings = [];
    moduleFiles.forEach((file) => {
        if (!fs_1.default.existsSync(file))
            return;
        const content = fs_1.default.readFileSync(file, 'utf8');
        // Check for explicit named imports (good for tree-shaking)
        const namedImports = content.match(/import\s*\{\s*[^}]+\s*\}\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g) ||
            [];
        const wildcardImports = content.match(/import\s*\*\s*as\s*\w+\s*from\s*['"]@\/shared\/interfaces\/[^'"]+['"]/g) || [];
        if (wildcardImports.length > 0 && namedImports.length > 0) {
            warnings.push(`${file}: Mix of named and wildcard imports may affect tree-shaking`);
        }
        if (wildcardImports.length > namedImports.length) {
            warnings.push(`${file}: Prefer named imports over wildcard imports for better tree-shaking`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Generate a comprehensive validation report
 */
function generateValidationReport(interfacesDir, clientModuleFiles, serverModuleFiles) {
    const allModuleFiles = [...clientModuleFiles, ...serverModuleFiles];
    const allErrors = [];
    const allWarnings = [];
    // Run all validations
    const validations = [
        validateNoCentralHubs(interfacesDir),
        validateSingleResponsibility(interfacesDir),
        validateExplicitImports(allModuleFiles),
        validateTreeShakingCompatibility(allModuleFiles),
        detectCircularDependencies(buildInterfaceDependencyGraph(interfacesDir)),
    ];
    validations.forEach(result => {
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    });
    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
    };
}
//# sourceMappingURL=dependency-validation.utils.js.map